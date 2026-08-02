import { EventEmitter } from 'events';
import { XMLParser } from 'fast-xml-parser';

import _ from '#src/utils/helpers/under-dash';
import utils from '#src/utils/helpers/utils';
import colCache from '#src/utils/data/col-cache';
import Dimensions from '#src/models/range';

import Row from '#src/models/row';
import Column from '#src/models/column';
import type { WorksheetLike, CellLike } from '#src/models/internal-types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const textDecoder = new TextDecoder('utf-8');

function decodeChunk(chunk: unknown): string {
  if (typeof chunk === 'string') return chunk;
  if (chunk instanceof Uint8Array) return textDecoder.decode(chunk);
  if (Buffer.isBuffer(chunk)) return textDecoder.decode(chunk);
  return String(chunk);
}

/** Extract text content from a fast-xml-parser node value. */
function getNodeText(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (typeof val === 'object' && '#text' in (val as Record<string, unknown>)) {
    return String((val as Record<string, unknown>)['#text']);
  }
  return '';
}

// Shared XMLParser for worksheet XML
const worksheetParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  htmlEntities: true,
  trimValues: false,
  parseTagValue: false,
  textNodeName: '#text',
  isArray: (name: string) => ['col', 'row', 'c', 'hyperlink'].includes(name),
});

// ---------------------------------------------------------------------------
// WorksheetReader
// ---------------------------------------------------------------------------

export interface WorksheetReaderOptions {
  workbook: {
    sharedStrings?: unknown[];
    styles?: { getStyleModel(id: number): Record<string, unknown> | undefined };
    properties?: { model?: { date1904?: boolean } };
  };
  id: number | string;
  iterator: AsyncIterable<unknown>;
  options: {
    worksheets?: string;
    hyperlinks?: string;
    [key: string]: unknown;
  };
}

interface WorksheetEvent {
  eventType: 'row' | 'hyperlink';
  value: unknown;
}

class WorksheetReader extends EventEmitter {
  workbook: WorksheetReaderOptions['workbook'];
  id: number | string;
  iterator: AsyncIterable<unknown>;
  options: WorksheetReaderOptions['options'];
  name: string;
  _columns: Column[] | null;
  _keys: Record<string, Column>;
  _dimensions: Dimensions;
  hyperlinks: Record<string, unknown> | undefined;

  constructor({ workbook, id, iterator, options }: Partial<WorksheetReaderOptions> = {}) {
    super();

    this.workbook = workbook as WorksheetReaderOptions['workbook'];
    this.id = id as number | string;
    this.iterator = iterator as AsyncIterable<unknown>;
    this.options = options || {};

    // and a name
    this.name = `Sheet${this.id}`;

    // column definitions
    this._columns = null;
    this._keys = {};

    // keep a record of dimensions
    this._dimensions = new Dimensions();
  }

  // destroy - not a valid operation for a streaming writer
  // even though some streamers might be able to, it's a bad idea.
  destroy() {
    throw new Error('Invalid Operation: destroy');
  }

  // return the current dimensions of the writer
  get dimensions(): Dimensions {
    return this._dimensions;
  }

  // =========================================================================
  // Columns

  // get the current columns array.
  get columns(): Column[] | null {
    return this._columns;
  }

  // get a single column by col number. If it doesn't exist, it and any gaps before it
  // are created.
  getColumn(c: number | string): Column {
    if (typeof c === 'string') {
      // if it matches a key'd column, return that
      const col = this._keys[c];
      if (col) {
        return col;
      }

      // otherise, assume letter
      c = colCache.l2n(c);
    }
    if (!this._columns) {
      this._columns = [];
    }
    if (c > this._columns.length) {
      let n = this._columns.length + 1;
      while (n <= c) {
        this._columns.push(new Column(this as unknown as WorksheetLike, n++));
      }
    }
    return this._columns[c - 1];
  }

  getColumnKey(key: string): Column | undefined {
    return this._keys[key];
  }

  setColumnKey(key: string, value: Column) {
    this._keys[key] = value;
  }

  deleteColumnKey(key: string) {
    delete this._keys[key];
  }

  eachColumnKey(f: (column: Column, key: string) => void) {
    _.each(this._keys, f);
  }

  async read() {
    try {
      for await (const events of this.parse()) {
        for (const { eventType, value } of events) {
          this.emit(eventType, value);
        }
      }
      this.emit('finished');
    } catch (error: unknown) {
      this.emit('error', error);
    }
  }

  async *[Symbol.asyncIterator]() {
    for await (const events of this.parse()) {
      for (const { eventType, value } of events) {
        if (eventType === 'row') {
          yield value;
        }
      }
    }
  }

  async *parse(): AsyncGenerator<WorksheetEvent[]> {
    const { iterator, options } = this;
    let emitSheet = false;
    let emitHyperlinks = false;
    let hyperlinks: Record<string, Record<string, unknown>> | null = null;

    switch (options.worksheets) {
      case 'emit':
        emitSheet = true;
        break;
      case 'prep':
        break;
      default:
        break;
    }
    switch (options.hyperlinks) {
      case 'emit':
        emitHyperlinks = true;
        break;
      case 'cache':
        this.hyperlinks = hyperlinks = {};
        break;
      default:
        break;
    }
    if (!emitSheet && !emitHyperlinks && !hyperlinks) {
      return;
    }

    // references
    const { sharedStrings, styles, properties } = this.workbook;

    // Collect all XML chunks
    const parts: string[] = [];
    for await (const chunk of iterator) {
      parts.push(decodeChunk(chunk));
    }
    const xml = parts.join('');
    if (!xml) return;

    const doc = worksheetParser.parse(xml);
    const ws = doc.worksheet;
    if (!ws) return;

    // -----------------------------------------------------------------------
    // Hyperlinks from <hyperlinks> element — parsed FIRST so we can apply
    // them to cells during row processing (fixes ordering issue in old code).
    // -----------------------------------------------------------------------
    if ((emitHyperlinks || hyperlinks) && ws.hyperlinks?.hyperlink) {
      for (const hl of ws.hyperlinks.hyperlink as Record<string, string>[]) {
        const hyperlink = {
          ref: hl.ref,
          rId: hl['r:id'],
        };
        if (hyperlinks) {
          hyperlinks[hyperlink.ref] = hyperlink;
        }
      }
    }

    // -----------------------------------------------------------------------
    // Columns
    // -----------------------------------------------------------------------
    if (emitSheet && ws.cols?.col) {
      const cols = (ws.cols.col as Record<string, string>[]).map((col) => ({
        min: parseInt(col.min, 10),
        max: parseInt(col.max, 10),
        width: parseFloat(col.width),
        styleId: parseInt(col.style || '0', 10),
      }));
      this._columns = Column.fromModel(this as unknown as WorksheetLike, cols);
    }

    // -----------------------------------------------------------------------
    // Rows & cells
    // -----------------------------------------------------------------------
    if (emitSheet && ws.sheetData?.row) {
      for (const rowNode of ws.sheetData.row as Record<string, unknown>[]) {
        const worksheetEvents: WorksheetEvent[] = [];

        const r = parseInt(rowNode.r as string, 10);
        const row = new Row(this as unknown as WorksheetLike, r);

        if (rowNode.ht) {
          row.height = parseFloat(rowNode.ht as string);
        }
        if (rowNode.s) {
          const styleId = parseInt(rowNode.s as string, 10);
          const style = styles?.getStyleModel(styleId);
          if (style) {
            row.style = style;
          }
        }

        for (const cellNode of (rowNode.c as Record<string, unknown>[]) || []) {
          const address = colCache.decodeAddress(cellNode.r as string);
          const cell = row.getCell(address.col);

          // Cell style
          if (cellNode.s) {
            const style = styles?.getStyleModel(parseInt(cellNode.s as string, 10));
            if (style) {
              cell.style = style;
            }
          }

          const cellType: string | undefined = cellNode.t as string | undefined;
          const fNode = cellNode.f;
          const vNode = cellNode.v;

          if (fNode !== undefined) {
            // ---------------------------------------------------------------
            // Formula cell
            // ---------------------------------------------------------------
            const formulaText = getNodeText(fNode);
            const fAttrs: Record<string, unknown> =
              typeof fNode === 'object' && fNode !== null ? (fNode as Record<string, unknown>) : {};

            const cellValue: Record<string, unknown> = {};
            if (formulaText) cellValue.formula = formulaText;
            if (fAttrs.t) cellValue.shareType = fAttrs.t;
            if (fAttrs.ref) cellValue.ref = fAttrs.ref;
            if (fAttrs.si !== undefined) cellValue.si = fAttrs.si;

            if (vNode !== undefined) {
              const vText = getNodeText(vNode);
              if (cellType === 'str') {
                cellValue.result = vText;
              } else if (cellType === 'b') {
                cellValue.result = parseInt(vText, 10) !== 0;
              } else if (cellType === 'e') {
                cellValue.result = { error: vText };
              } else {
                cellValue.result = parseFloat(vText);
              }
            }
            cell.value = cellValue;
          } else if (vNode !== undefined) {
            // ---------------------------------------------------------------
            // Value cell
            // ---------------------------------------------------------------
            const vText = getNodeText(vNode);
            switch (cellType) {
              case 's': {
                const index = parseInt(vText, 10);
                if (sharedStrings) {
                  cell.value = sharedStrings[index];
                } else {
                  cell.value = { sharedString: index };
                }
                break;
              }

              case 'inlineStr':
              case 'str':
                cell.value = vText;
                break;

              case 'e':
                cell.value = { error: vText };
                break;

              case 'b':
                cell.value = parseInt(vText, 10) !== 0;
                break;

              default:
                if (utils.isDateFmt(cell.numFmt as string)) {
                  cell.value = utils.excelToDate(parseFloat(vText), properties?.model?.date1904);
                } else {
                  cell.value = parseFloat(vText);
                }
                break;
            }
          } else if (cellNode.is !== undefined) {
            // ---------------------------------------------------------------
            // Inline string cell
            // ---------------------------------------------------------------
            const isNode = cellNode.is;
            const tNode =
              typeof isNode === 'object' && isNode !== null
                ? (isNode as Record<string, unknown>).t
                : undefined;
            cell.value = tNode !== undefined ? getNodeText(tNode) : '';
          }

          // Apply cached hyperlink if present
          if (hyperlinks) {
            const hyperlink = hyperlinks[cellNode.r as string];
            if (hyperlink) {
              // NB: `text` is a getter-only accessor on Cell (no setter) —
              // this assignment already throws a TypeError at runtime in the
              // original code too (classes are always strict mode); preserved
              // verbatim rather than silently fixed during a typing pass.
              (cell as unknown as CellLike).text = cell.value;
              cell.value = undefined;
              (cell as unknown as CellLike).hyperlink = hyperlink;
            }
          }
        }

        this._dimensions.expandRow(row);
        worksheetEvents.push({ eventType: 'row', value: row });

        if (worksheetEvents.length > 0) {
          yield worksheetEvents;
        }
      }
    }

    // -----------------------------------------------------------------------
    // Emit hyperlink events (emit mode — emit after rows are done)
    // -----------------------------------------------------------------------
    if (emitHyperlinks && ws.hyperlinks?.hyperlink) {
      const hyperlinkEvents: WorksheetEvent[] = [];
      for (const hl of ws.hyperlinks.hyperlink as Record<string, string>[]) {
        hyperlinkEvents.push({
          eventType: 'hyperlink',
          value: { ref: hl.ref, rId: hl['r:id'] },
        });
      }
      if (hyperlinkEvents.length > 0) {
        yield hyperlinkEvents;
      }
    }
  }
}

export default WorksheetReader;
