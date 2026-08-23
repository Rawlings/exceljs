import { EventEmitter } from 'node:events';
import { XMLParser } from 'fast-xml-parser';

import _ from '../utils/helpers/under-dash';
import utils from '../utils/helpers/utils';
import colCache from '../utils/data/col-cache';
import { Range as Dimensions } from '../core/range';

import { Row } from '../core/row';
import { Column } from '../core/column';
import type { CellLike } from '../core/internal-types';
import type { CellErrorValue, CellValue } from '../core/cell';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const textDecoder = new TextDecoder('utf-8');

const VALID_ERRORS: ReadonlySet<string> = new Set([
  '#N/A',
  '#REF!',
  '#NAME?',
  '#DIV/0!',
  '#NULL!',
  '#VALUE!',
  '#NUM!',
]);

function isCellError(val: string): val is CellErrorValue['error'] {
  return VALID_ERRORS.has(val);
}

function decodeChunk(chunk: unknown): string {
  if (typeof chunk === 'string') return chunk;
  if (chunk instanceof Uint8Array) return textDecoder.decode(chunk);
  if (Buffer.isBuffer(chunk)) return textDecoder.decode(chunk);
  return String(chunk);
}

/** Extract text content from a fast-xml-parser node value. */
function getNodeText(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) {
    return getNodeText(val[0]);
  }
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (typeof val === 'object' && '#text' in val) {
    return String(val['#text']);
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

interface RawHyperlink {
  ref?: string;
  'r:id'?: string;
}

interface RawCol {
  min?: string | number;
  max?: string | number;
  width?: string | number;
  style?: string | number;
  ':@'?: Record<string, string>;
}

interface RawFormula {
  '#text'?: unknown;
  t?: string;
  ref?: string;
  si?: number | string;
}

interface RawCell {
  r?: string;
  s?: string | number;
  t?: string;
  f?: string | RawFormula;
  v?: unknown;
  is?: { t?: unknown };
  ':@'?: Record<string, string>;
}

interface RawRow {
  r?: string | number;
  ht?: string | number;
  s?: string | number;
  c?: RawCell | RawCell[];
  ':@'?: Record<string, string>;
}

interface RawWorksheetDoc {
  worksheet?: {
    cols?: {
      col?: RawCol | RawCol[];
    };
    sheetData?: {
      row?: RawRow | RawRow[];
    };
    hyperlinks?: {
      hyperlink?: RawHyperlink | RawHyperlink[];
    };
  };
}

function isRawWorksheetDoc(val: unknown): val is RawWorksheetDoc {
  return typeof val === 'object' && val !== null && 'worksheet' in val;
}

// ---------------------------------------------------------------------------
// WorksheetReader
// ---------------------------------------------------------------------------

export interface WorksheetReaderOptions {
  workbook: {
    sharedStrings?: unknown[];
    styles?: { getStyleModel(id: number): Record<string, unknown> | null | undefined };
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

export class WorksheetReader extends EventEmitter {
  workbook: WorksheetReaderOptions['workbook'];
  id: number | string;
  iterator: AsyncIterable<unknown>;
  options: WorksheetReaderOptions['options'];
  name: string;
  state?: string;
  _columns: Column[] | null;
  _keys: Record<string, Column | undefined>;
  _dimensions: Dimensions;
  hyperlinks: Record<string, Record<string, unknown> | undefined> | undefined;

  constructor(options: Partial<WorksheetReaderOptions> = {}) {
    super();

    this.workbook = options.workbook ?? {};
    this.id = options.id ?? 1;
    this.iterator = options.iterator ?? (async function* () {})();
    this.options = options.options ?? {};

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
  get dimensions() {
    return this._dimensions;
  }

  // =========================================================================
  // Columns

  // get the current columns array.
  get columns() {
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
    this._columns ??= [];
    if (c > this._columns.length) {
      let n = this._columns.length + 1;
      while (n <= c) {
        this._columns.push(new Column(this, n++));
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
    Object.entries(this._keys).forEach(([key, column]) => {
      if (column) f(column, key);
    });
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
    let hyperlinks: Record<string, Record<string, unknown> | undefined> | null = null;

    switch (options.worksheets) {
      case 'emit':
        emitSheet = true;
        break;
      case 'prep':
      case undefined:
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
      case undefined:
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

    const rawDoc: unknown = worksheetParser.parse(xml);
    if (!isRawWorksheetDoc(rawDoc)) return;
    const ws = rawDoc.worksheet;
    if (!ws) return;

    // -----------------------------------------------------------------------
    // Hyperlinks from <hyperlinks> element — parsed FIRST so we can apply
    // them to cells during row processing (fixes ordering issue in old code).
    // -----------------------------------------------------------------------
    if ((emitHyperlinks || hyperlinks) && ws.hyperlinks?.hyperlink) {
      const rawHyperlinks = Array.isArray(ws.hyperlinks.hyperlink)
        ? ws.hyperlinks.hyperlink
        : [ws.hyperlinks.hyperlink];
      for (const hl of rawHyperlinks) {
        if (hl.ref) {
          const hyperlink: Record<string, unknown> = {
            ref: hl.ref,
            rId: hl['r:id'],
          };
          if (hyperlinks) {
            hyperlinks[hl.ref] = hyperlink;
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // Columns
    // -----------------------------------------------------------------------
    if (emitSheet && ws.cols?.col) {
      const rawCols = Array.isArray(ws.cols.col) ? ws.cols.col : [ws.cols.col];
      const cols = rawCols.map((col) => {
        const cAttrs = col[':@'] ?? col;
        return {
          min: parseInt(String(cAttrs.min ?? col.min ?? '0'), 10),
          max: parseInt(String(cAttrs.max ?? col.max ?? '0'), 10),
          width: parseFloat(String(cAttrs.width ?? col.width ?? '0')),
          styleId: parseInt(String(cAttrs.style ?? col.style ?? '0'), 10),
        };
      });
      this._columns = Column.fromModel(this, cols);
    }

    // -----------------------------------------------------------------------
    // Rows & cells
    // -----------------------------------------------------------------------
    if (emitSheet && ws.sheetData?.row) {
      const rowNodes = Array.isArray(ws.sheetData.row) ? ws.sheetData.row : [ws.sheetData.row];
      for (const rowNode of rowNodes) {
        const worksheetEvents: WorksheetEvent[] = [];

        const rAttrs = rowNode[':@'] ?? rowNode;
        const r = parseInt(String(rAttrs.r ?? rowNode.r ?? '0'), 10);
        const row = new Row(this, r);

        const ht = rAttrs.ht ?? rowNode.ht;
        if (ht !== undefined) {
          row.height = parseFloat(String(ht));
        }
        const rowStyle = rAttrs.s ?? rowNode.s;
        if (rowStyle !== undefined) {
          const styleId = parseInt(String(rowStyle), 10);
          const style = styles?.getStyleModel(styleId);
          if (style) {
            row.style = style;
          }
        }

        const cellNodes = Array.isArray(rowNode.c) ? rowNode.c : rowNode.c ? [rowNode.c] : [];
        for (const cellNode of cellNodes) {
          const cAttrs = cellNode[':@'] ?? cellNode;
          const cellRef = cAttrs.r ?? cellNode.r ?? '';
          if (!cellRef) continue;
          const address = colCache.decodeAddress(cellRef);
          const cell = row.getCell(address.col);

          // Cell style
          const cellStyle = cAttrs.s ?? cellNode.s;
          if (cellStyle !== undefined) {
            const styleId = parseInt(String(cellStyle), 10);
            const style = styles?.getStyleModel(styleId);
            if (style) {
              cell.style = style;
            }
          }

          const cellType = cAttrs.t ?? cellNode.t;
          const fNode = cellNode.f;
          const vNode = cellNode.v;

          if (fNode !== undefined) {
            // ---------------------------------------------------------------
            // Formula cell
            // ---------------------------------------------------------------
            const formulaText = getNodeText(fNode);
            const fAttrs = typeof fNode === 'object' ? fNode : undefined;

            const cellValue: Record<string, unknown> = {};
            if (formulaText) cellValue.formula = formulaText;
            if (fAttrs?.t) cellValue.shareType = fAttrs.t;
            if (fAttrs?.ref) cellValue.ref = fAttrs.ref;
            if (fAttrs?.si !== undefined) cellValue.si = fAttrs.si;

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
            cell.value = cellValue as unknown as CellValue;
          } else if (vNode !== undefined) {
            // ---------------------------------------------------------------
            // Value cell
            // ---------------------------------------------------------------
            const vText = getNodeText(vNode);
            switch (cellType) {
              case 's': {
                const index = parseInt(vText, 10);
                if (sharedStrings?.[index] !== undefined) {
                  cell.value = sharedStrings[index] as CellValue;
                } else {
                  cell.value = { sharedString: index } as unknown as CellValue;
                }
                break;
              }

              case 'inlineStr':
              case 'str':
                cell.value = vText;
                break;

              case 'e':
                cell.value = { error: isCellError(vText) ? vText : '#VALUE!' };
                break;

              case 'b':
                cell.value = parseInt(vText, 10) !== 0;
                break;

              case undefined:
              default:
                if (utils.isDateFmt(cell.numFmt ?? '')) {
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
            const tNode = typeof isNode === 'object' ? isNode.t : undefined;
            cell.value = tNode !== undefined ? getNodeText(tNode) : '';
          }

          // Apply cached hyperlink if present
          if (hyperlinks && cellRef) {
            const hyperlink = hyperlinks[cellRef];
            if (hyperlink !== undefined) {
              // NB: `text` is a getter-only accessor on Cell (no setter) —
              // this assignment already throws a TypeError at runtime in the
              // original code too (classes are always strict mode); preserved
              // verbatim rather than silently fixed during a typing pass.
              (cell as CellLike).text = cell.value as string | undefined;
              cell.value = undefined;
              (cell as CellLike).hyperlink =
                typeof hyperlink === 'string'
                  ? hyperlink
                  : (hyperlink?.hyperlink as string | undefined);
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
      const rawHyperlinks = Array.isArray(ws.hyperlinks.hyperlink)
        ? ws.hyperlinks.hyperlink
        : [ws.hyperlinks.hyperlink];
      const hyperlinkEvents: WorksheetEvent[] = [];
      for (const hl of rawHyperlinks) {
        if (hl.ref) {
          hyperlinkEvents.push({
            eventType: 'hyperlink',
            value: { ref: hl.ref, rId: hl['r:id'] },
          });
        }
      }
      if (hyperlinkEvents.length > 0) {
        yield hyperlinkEvents;
      }
    }
  }
}

export default WorksheetReader;
