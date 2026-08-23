import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import { unzip } from '../utils/stream/zip';
import iterateStream from '../utils/stream/iterate-stream';

import StyleManager from '../formats/xlsx/xml/style/styles-xform';
import WorkbookXform, { type WorkbookXformModel } from '../formats/xlsx/xml/book/workbook-xform';
import RelationshipsXform from '../formats/xlsx/xml/core/relationships-xform';
import type { RelationshipModel } from '../formats/xlsx/xml/core/relationship-xform';

import { WorksheetReader } from './worksheet-reader';
import HyperlinkReader from './hyperlink-reader';

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

async function collectXml(iterable: AsyncIterable<unknown>): Promise<string> {
  const parts: string[] = [];
  for await (const chunk of iterable) {
    parts.push(decodeChunk(chunk));
  }
  return parts.join('');
}

/** Safely extract text from a fast-xml-parser node value. */
function getNodeText(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (typeof val === 'object' && '#text' in val) {
    return String(val['#text']);
  }
  return '';
}

// Shared parser for sharedStrings.xml
const sharedStringsParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  htmlEntities: true,
  trimValues: false,
  parseTagValue: false,
  textNodeName: '#text',
  isArray: (name: string) => name === 'si' || name === 'r',
});

interface RawColor {
  rgb?: string;
  argb?: string;
  theme?: number | string;
}

interface RawRPr {
  b?: unknown;
  i?: unknown;
  u?: unknown;
  outline?: unknown;
  strike?: unknown;
  sz?: string | number | { val?: string | number };
  rFont?: string | { val?: string };
  family?: string | number | { val?: string | number };
  charset?: string | number | { val?: string | number };
  vertAlign?: string | { val?: string };
  color?: RawColor;
}

interface RawRun {
  rPr?: RawRPr;
  t?: unknown;
}

interface RawSi {
  t?: unknown;
  r?: RawRun | RawRun[];
}

interface RawSstDoc {
  sst?: {
    si?: RawSi | RawSi[];
  };
}

function isRawSstDoc(val: unknown): val is RawSstDoc {
  return typeof val === 'object' && val !== null && 'sst' in val;
}

// ---------------------------------------------------------------------------
// WorkbookReader
// ---------------------------------------------------------------------------

export interface WorkbookStreamReaderOptions {
  worksheets?: 'emit' | 'ignore';
  sharedStrings?: 'cache' | 'emit' | 'ignore';
  hyperlinks?: 'cache' | 'emit' | 'ignore';
  styles?: 'cache' | 'ignore';
  entries?: 'emit' | 'ignore';
  [key: string]: unknown;
}

interface ParseEvent {
  eventType: 'shared-strings' | 'worksheet' | 'hyperlinks';
  value: unknown;
}

type ParseItem = ParseEvent | { index: number; text: unknown };

interface ZipEntryStream extends Readable {
  path: string;
  autodrain?: () => void;
}

export class WorkbookReader extends EventEmitter {
  static Options: Record<string, string[]>;
  input: string | Readable | undefined;
  options: WorkbookStreamReaderOptions;
  styles: StyleManager;
  stream: Readable | undefined;
  sharedStrings: unknown[] | undefined;
  workbookRels: RelationshipModel[] | undefined;
  model: Partial<WorkbookXformModel>;
  properties?: { model?: { date1904?: boolean } };

  constructor(input?: string | Readable, options: WorkbookStreamReaderOptions = {}) {
    super();

    this.input = input;

    this.options = {
      worksheets: 'emit',
      sharedStrings: 'ignore',
      hyperlinks: 'ignore',
      styles: 'ignore',
      entries: 'ignore',
      ...options,
    };

    this.styles = new StyleManager();
    this.styles.init();
    this.sharedStrings = undefined;
    this.model = {};
  }

  _getStream(input: string | Readable | undefined): Readable {
    if (input instanceof Readable) {
      return input;
    }
    if (typeof input === 'string') {
      return fs.createReadStream(input);
    }
    throw new Error(`Could not recognise input: ${input}`);
  }

  async read(input?: string | Readable, options?: WorkbookStreamReaderOptions) {
    try {
      for await (const item of this.parse(input, options)) {
        if ('eventType' in item) {
          const { eventType, value } = item;
          switch (eventType) {
            case 'shared-strings':
              this.emit(eventType, value);
              break;
            case 'worksheet':
              this.emit(eventType, value);
              if (value instanceof WorksheetReader) {
                await value.read();
              }
              break;
            case 'hyperlinks':
              this.emit(eventType, value);
              break;
            default:
              break;
          }
        }
      }
      this.emit('end');
      this.emit('finished');
    } catch (error: unknown) {
      this.emit('error', error);
    }
  }

  async *[Symbol.asyncIterator]() {
    for await (const item of this.parse(undefined, undefined)) {
      if ('eventType' in item && item.eventType === 'worksheet') {
        yield item.value;
      }
    }
  }

  async *parse(
    input?: string | Readable,
    options?: WorkbookStreamReaderOptions,
  ): AsyncGenerator<ParseItem> {
    if (options) this.options = { ...this.options, ...options };
    const stream = (this.stream = this._getStream(input ?? this.input));
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      }
    }
    const files = unzip(Buffer.concat(chunks));

    // 1. Relationships
    const relsBuf = files['xl/_rels/workbook.xml.rels'];
    if (relsBuf) {
      const relsEntry = Object.assign(Readable.from(relsBuf), {
        path: 'xl/_rels/workbook.xml.rels',
      });
      await this._parseRels(relsEntry);
    }

    // 2. Workbook structure / properties
    const workbookBuf = files['xl/workbook.xml'];
    if (workbookBuf) {
      const workbookEntry = Object.assign(Readable.from(workbookBuf), {
        path: 'xl/workbook.xml',
      });
      await this._parseWorkbook(workbookEntry);
    }

    // 3. Styles
    const stylesBuf = files['xl/styles.xml'];
    if (stylesBuf) {
      const stylesEntry = Object.assign(Readable.from(stylesBuf), {
        path: 'xl/styles.xml',
      });
      await this._parseStyles(stylesEntry);
    }

    // 4. Shared strings
    const sstBuf = files['xl/sharedStrings.xml'];
    if (sstBuf) {
      const sstEntry = Object.assign(Readable.from(sstBuf), {
        path: 'xl/sharedStrings.xml',
      });
      yield* this._parseSharedStrings(sstEntry);
    }

    // 5. Hyperlinks
    for (const [path, buf] of Object.entries(files)) {
      if (path.endsWith('/')) continue;
      const match = path.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml\.rels/);
      if (match) {
        const sheetNo = match[1];
        const entry = Object.assign(Readable.from(buf), { path });
        yield* this._parseHyperlinks(iterateStream(entry), sheetNo);
      }
    }

    // 6. Worksheets (ordered by sheet index)
    const worksheetPaths = Object.keys(files).filter((path) =>
      /xl\/worksheets\/sheet\d+[.]xml$/.test(path),
    );
    worksheetPaths.sort((a, b) => {
      const numA = parseInt(a.match(/sheet(\d+)[.]xml/)?.[1] ?? '0', 10);
      const numB = parseInt(b.match(/sheet(\d+)[.]xml/)?.[1] ?? '0', 10);
      return numA - numB;
    });

    for (const path of worksheetPaths) {
      const buf = files[path];
      if (!buf) continue;
      const match = path.match(/xl\/worksheets\/sheet(\d+)[.]xml/);
      const sheetNo = match ? match[1] : '';
      const entry = Object.assign(Readable.from(buf), { path });
      yield* this._parseWorksheet(iterateStream(entry), sheetNo);
    }
  }

  _emitEntry(payload: Record<string, unknown>) {
    if (this.options.entries === 'emit') {
      this.emit('entry', payload);
    }
  }

  async _parseRels(entry: ZipEntryStream) {
    const xform = new RelationshipsXform();
    const rels: unknown = await xform.parseStream(iterateStream(entry));
    if (Array.isArray(rels)) {
      this.workbookRels = rels.filter(
        (r): r is RelationshipModel => typeof r === 'object' && r !== null,
      );
    }
  }

  async _parseWorkbook(entry: ZipEntryStream) {
    this._emitEntry({ type: 'workbook' });

    const workbook = new WorkbookXform();
    await workbook.parseStream(iterateStream(entry));

    this.properties = workbook.map.workbookPr;
    this.model = workbook.model;
  }

  async *_parseSharedStrings(entry: ZipEntryStream) {
    this._emitEntry({ type: 'shared-strings' });

    switch (this.options.sharedStrings) {
      case 'cache':
        this.sharedStrings = [];
        break;
      case 'emit':
        break;
      case 'ignore':
      case undefined:
      default:
        return;
    }

    const xml = await collectXml(iterateStream(entry));
    if (!xml) return;

    const rawDoc: unknown = sharedStringsParser.parse(xml);
    if (!isRawSstDoc(rawDoc)) return;
    const sst = rawDoc.sst;
    if (!sst?.si) return;

    let index = 0;
    const items = Array.isArray(sst.si) ? sst.si : [sst.si];
    for (const si of items) {
      let text: string | null = null;
      const richText: { font: Record<string, unknown> | null; text: string | null }[] = [];

      // Plain text: <si><t>...</t></si>
      if (si.t !== undefined) {
        text = getNodeText(si.t);
      }

      // Rich text runs: <si><r>...</r></si>
      if (si.r) {
        const runs = Array.isArray(si.r) ? si.r : [si.r];
        for (const run of runs) {
          let font: Record<string, unknown> | null = null;
          const rPr = run.rPr;
          if (rPr) {
            font = {};
            if (rPr.b !== undefined) font.bold = true;
            if (rPr.i !== undefined) font.italic = true;
            if (rPr.u !== undefined) font.underline = true;
            if (rPr.outline !== undefined) font.outline = true;
            if (rPr.strike !== undefined) font.strike = true;
            if (rPr.sz !== undefined) {
              const szVal = typeof rPr.sz === 'object' ? rPr.sz.val : rPr.sz;
              font.size = parseInt(String(szVal ?? '0'), 10);
            }
            if (rPr.rFont !== undefined) {
              font.name =
                typeof rPr.rFont === 'object'
                  ? (rPr.rFont.val ?? getNodeText(rPr.rFont))
                  : rPr.rFont;
            }
            if (rPr.family !== undefined) {
              const familyVal = typeof rPr.family === 'object' ? rPr.family.val : rPr.family;
              font.family = parseInt(String(familyVal ?? '0'), 10);
            }
            if (rPr.charset !== undefined) {
              const charsetVal = typeof rPr.charset === 'object' ? rPr.charset.val : rPr.charset;
              font.charset = parseInt(String(charsetVal ?? '0'), 10);
            }
            if (rPr.vertAlign !== undefined) {
              font.vertAlign =
                typeof rPr.vertAlign === 'object' ? rPr.vertAlign.val : rPr.vertAlign;
            }
            if (rPr.color !== undefined) {
              const colorObj: Record<string, unknown> = {};
              if (rPr.color.rgb) colorObj.argb = rPr.color.rgb;
              if (rPr.color.argb) colorObj.argb = rPr.color.argb;
              if (rPr.color.theme !== undefined) colorObj.theme = rPr.color.theme;
              font.color = colorObj;
            }
          }

          const runText = run.t !== undefined ? getNodeText(run.t) : null;
          richText.push({ font, text: runText });
        }
      }

      const value = richText.length > 0 ? { richText } : text;

      if (this.options.sharedStrings === 'cache') {
        this.sharedStrings?.push(value);
      } else {
        yield { index: index++, text: value };
      }
    }
  }

  async _parseStyles(entry: ZipEntryStream) {
    this._emitEntry({ type: 'styles' });
    if (this.options.styles === 'cache') {
      this.styles = new StyleManager();
      await this.styles.parseStream(iterateStream(entry));
    }
  }

  *_parseWorksheet(iterator: AsyncIterable<unknown>, sheetNo: string): Generator<ParseEvent> {
    this._emitEntry({ type: 'worksheet', id: sheetNo });
    const worksheetReader = new WorksheetReader({
      workbook: this,
      id: sheetNo,
      iterator,
      options: this.options,
    });

    const matchingRel = (this.workbookRels ?? []).find(
      (rel) => rel.Target === `worksheets/sheet${sheetNo}.xml`,
    );
    const sheets = this.model.sheets ?? [];
    const matchingSheet = matchingRel
      ? sheets.find((sheet) => sheet.rId === matchingRel.Id)
      : undefined;
    if (matchingSheet) {
      if (matchingSheet.id !== undefined) worksheetReader.id = matchingSheet.id;
      worksheetReader.name = matchingSheet.name;
      if (matchingSheet.state !== undefined) worksheetReader.state = matchingSheet.state;
    }
    if (this.options.worksheets === 'emit') {
      yield { eventType: 'worksheet', value: worksheetReader };
    }
  }

  *_parseHyperlinks(iterator: AsyncIterable<unknown>, sheetNo: string): Generator<ParseEvent> {
    this._emitEntry({ type: 'hyperlinks', id: sheetNo });
    const hyperlinksReader = new HyperlinkReader({
      workbook: this,
      id: sheetNo,
      iterator,
      options: this.options,
    });
    if (this.options.hyperlinks === 'emit') {
      yield { eventType: 'hyperlinks', value: hyperlinksReader };
    }
  }
}

// for reference - these are the valid values for options
WorkbookReader.Options = {
  worksheets: ['emit', 'ignore'],
  sharedStrings: ['cache', 'emit', 'ignore'],
  hyperlinks: ['cache', 'emit', 'ignore'],
  styles: ['cache', 'ignore'],
  entries: ['emit', 'ignore'],
};

export default WorkbookReader;
