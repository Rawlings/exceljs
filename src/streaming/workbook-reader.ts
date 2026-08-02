import { EventEmitter } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import fs from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import { unzip } from '../utils/stream/zip';
import iterateStream from '../utils/stream/iterate-stream';

import StyleManager from '../formats/xlsx/xml/style/styles-xform';
import WorkbookXform from '../formats/xlsx/xml/book/workbook-xform';
import RelationshipsXform from '../formats/xlsx/xml/core/relationships-xform';

import WorksheetReader from './worksheet-reader';
import type { WorksheetReaderOptions } from './worksheet-reader';
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
  if (typeof val === 'object' && '#text' in (val as Record<string, unknown>)) {
    return String((val as Record<string, unknown>)['#text']);
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

export class WorkbookReader extends EventEmitter {
  static Options: Record<string, string[]>;
  input: string | Readable | undefined;
  options: WorkbookStreamReaderOptions;
  styles: StyleManager;
  stream: Readable | undefined;
  sharedStrings: unknown[];
  workbookRels: Record<string, unknown>[] | undefined;
  model: Record<string, unknown>;
  properties: unknown;

  constructor(input?: string | Readable, options: WorkbookStreamReaderOptions = {}) {
    super();

    this.input = input;

    this.options = {
      worksheets: 'emit',
      sharedStrings: 'cache',
      hyperlinks: 'ignore',
      styles: 'ignore',
      entries: 'ignore',
      ...options,
    };

    this.styles = new StyleManager();
    (this.styles as unknown as { init(): void }).init();
    this.sharedStrings = [];
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
        // NB: shared-strings 'emit' mode yields {index, text} items with no
        // eventType — same as original, they fall through the switch below.
        const { eventType, value } = item as Partial<ParseEvent>;
        switch (eventType) {
          case 'shared-strings':
            this.emit(eventType, value);
            break;
          case 'worksheet':
            this.emit(eventType, value);
            await (value as { read(): Promise<void> }).read();
            break;
          case 'hyperlinks':
            this.emit(eventType, value);
            break;
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
      const { eventType, value } = item as Partial<ParseEvent>;
      if (eventType === 'worksheet') {
        yield value;
      }
    }
  }

  async *parse(input?: string | Readable, options?: WorkbookStreamReaderOptions) {
    if (options) this.options = options;
    const stream = (this.stream = this._getStream(input || this.input));
    const chunks: unknown[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const files = unzip(Buffer.concat(chunks as Uint8Array[]));
    const entries: (Readable & {
      path: string;
      autodrain?: () => void;
    })[] = [];
    for (const [path, buf] of Object.entries(files)) {
      if (path.endsWith('/')) continue;
      const entry = Readable.from(buf) as unknown as Readable & { path: string };
      entry.path = path;
      entries.push(entry as never);
    }

    const waitingWorkSheets: {
      sheetNo: string;
      path: string;
      tempFileCleanupCallback: () => void;
    }[] = [];
    for (const entry of entries) {
      let match: RegExpMatchArray | null;
      let sheetNo: string;
      switch (entry.path) {
        case '_rels/.rels':
          break;
        case 'xl/_rels/workbook.xml.rels':
          await this._parseRels(entry);
          break;
        case 'xl/workbook.xml':
          await this._parseWorkbook(entry);
          break;
        case 'xl/sharedStrings.xml':
          yield* this._parseSharedStrings(entry);
          break;
        case 'xl/styles.xml':
          await this._parseStyles(entry);
          break;
        default:
          if (entry.path.match(/xl\/worksheets\/sheet\d+[.]xml/)) {
            match = entry.path.match(/xl\/worksheets\/sheet(\d+)[.]xml/);
            sheetNo = (match as RegExpMatchArray)[1];
            if (this.sharedStrings && this.workbookRels) {
              yield* this._parseWorksheet(iterateStream(entry), sheetNo);
            } else {
              // create temp file for each worksheet
              await new Promise((resolve, reject) => {
                const tempPath = `/tmp/exceljs-sheet-${sheetNo}-${Date.now()}.xml`;
                waitingWorkSheets.push({
                  sheetNo,
                  path: tempPath,
                  tempFileCleanupCallback: () => {
                    try {
                      fs.unlinkSync(tempPath);
                    } catch {}
                  },
                });

                const tempStream = fs.createWriteStream(tempPath);
                tempStream.on('error', reject);
                (entry as unknown as { pipe(dst: unknown): void }).pipe(tempStream);
                return tempStream.on('finish', () => {
                  return resolve(undefined);
                });
              });
            }
          } else if (entry.path.match(/xl\/worksheets\/_rels\/sheet\d+[.]xml.rels/)) {
            match = entry.path.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml.rels/);
            sheetNo = (match as RegExpMatchArray)[1];
            yield* this._parseHyperlinks(iterateStream(entry), sheetNo);
          }
          break;
      }
      if (typeof entry.autodrain === 'function') {
        entry.autodrain();
      }
    }

    for (const { sheetNo, path, tempFileCleanupCallback } of waitingWorkSheets) {
      let fileStream: unknown = fs.createReadStream(path);
      if (!(fileStream as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator]) {
        fileStream = (fileStream as { pipe(dst: unknown): unknown }).pipe(new PassThrough());
      }
      yield* this._parseWorksheet(fileStream as AsyncIterable<unknown>, sheetNo);
      tempFileCleanupCallback();
    }
  }

  _emitEntry(payload: Record<string, unknown>) {
    if (this.options.entries === 'emit') {
      this.emit('entry', payload);
    }
  }

  async _parseRels(entry: unknown) {
    const xform = new RelationshipsXform();
    this.workbookRels = await xform.parseStream(iterateStream(entry as AsyncIterable<unknown>));
  }

  async _parseWorkbook(entry: unknown) {
    this._emitEntry({ type: 'workbook' });

    const workbook = new WorkbookXform();
    await workbook.parseStream(iterateStream(entry as AsyncIterable<unknown>));

    this.properties = (workbook as unknown as { map: { workbookPr: unknown } }).map.workbookPr;
    this.model = (workbook as unknown as { model: Record<string, unknown> }).model;
  }

  async *_parseSharedStrings(entry: unknown) {
    this._emitEntry({ type: 'shared-strings' });

    switch (this.options.sharedStrings) {
      case 'cache':
        this.sharedStrings = [];
        break;
      case 'emit':
        break;
      default:
        return;
    }

    const xml = await collectXml(iterateStream(entry as AsyncIterable<unknown>));
    if (!xml) return;

    const doc = sharedStringsParser.parse(xml);
    const sst = doc.sst;
    if (!sst || !sst.si) return;

    let index = 0;
    for (const si of sst.si) {
      let text: string | null = null;
      const richText: { font: Record<string, unknown> | null; text: string | null }[] = [];

      // Plain text: <si><t>...</t></si>
      if (si.t !== undefined) {
        text = getNodeText(si.t);
      }

      // Rich text runs: <si><r>...</r></si>
      if (si.r) {
        for (const run of si.r as Record<string, unknown>[]) {
          let font: Record<string, unknown> | null = null;
          const rPr = run.rPr as Record<string, unknown> | undefined;
          if (rPr) {
            font = {};
            if (rPr.b !== undefined) font.bold = true;
            if (rPr.i !== undefined) font.italic = true;
            if (rPr.u !== undefined) font.underline = true;
            if (rPr.outline !== undefined) font.outline = true;
            if (rPr.strike !== undefined) font.strike = true;
            if (rPr.sz !== undefined) {
              font.size = parseInt(
                typeof rPr.sz === 'object'
                  ? ((rPr.sz as Record<string, unknown>).val as string)
                  : String(rPr.sz),
                10
              );
            }
            if (rPr.rFont !== undefined) {
              font.name =
                typeof rPr.rFont === 'object'
                  ? ((rPr.rFont as Record<string, unknown>).val ?? getNodeText(rPr.rFont))
                  : String(rPr.rFont);
            }
            if (rPr.family !== undefined) {
              font.family = parseInt(
                typeof rPr.family === 'object'
                  ? ((rPr.family as Record<string, unknown>).val as string)
                  : String(rPr.family),
                10
              );
            }
            if (rPr.charset !== undefined) {
              font.charset = parseInt(
                typeof rPr.charset === 'object'
                  ? ((rPr.charset as Record<string, unknown>).val as string)
                  : String(rPr.charset),
                10
              );
            }
            if (rPr.vertAlign !== undefined) {
              font.vertAlign =
                typeof rPr.vertAlign === 'object'
                  ? (rPr.vertAlign as Record<string, unknown>).val
                  : String(rPr.vertAlign);
            }
            if (rPr.color !== undefined) {
              const c = rPr.color as Record<string, unknown>;
              const colorObj: Record<string, unknown> = {};
              if (c.rgb) colorObj.argb = c.rgb;
              if (c.argb) colorObj.argb = c.argb;
              if (c.theme !== undefined) colorObj.theme = c.theme;
              font.color = colorObj;
            }
          }

          const runText = run.t !== undefined ? getNodeText(run.t) : null;
          richText.push({ font, text: runText });
        }
      }

      const value = richText.length > 0 ? { richText } : text;

      if (this.options.sharedStrings === 'cache') {
        this.sharedStrings.push(value);
      } else if (this.options.sharedStrings === 'emit') {
        yield { index: index++, text: value };
      }
    }
  }

  async _parseStyles(entry: unknown) {
    this._emitEntry({ type: 'styles' });
    if (this.options.styles === 'cache') {
      this.styles = new StyleManager();
      await (
        this.styles as unknown as { parseStream(i: AsyncIterable<unknown>): Promise<void> }
      ).parseStream(iterateStream(entry as AsyncIterable<unknown>));
    }
  }

  *_parseWorksheet(iterator: AsyncIterable<unknown>, sheetNo: string): Generator<ParseEvent> {
    this._emitEntry({ type: 'worksheet', id: sheetNo });
    const worksheetReader = new WorksheetReader({
      workbook: this as unknown as WorksheetReaderOptions['workbook'],
      id: sheetNo,
      iterator,
      options: this.options,
    }) as unknown as { id: unknown; name: unknown; state: unknown };

    const matchingRel = (this.workbookRels || []).find(
      (rel) => rel.Target === `worksheets/sheet${sheetNo}.xml`
    );
    const matchingSheet =
      matchingRel &&
      ((this.model.sheets as Record<string, unknown>[]) || []).find(
        (sheet) => sheet.rId === matchingRel.Id
      );
    if (matchingSheet) {
      worksheetReader.id = matchingSheet.id;
      worksheetReader.name = matchingSheet.name;
      worksheetReader.state = matchingSheet.state;
    }
    if (this.options.worksheets === 'emit') {
      yield { eventType: 'worksheet', value: worksheetReader };
    }
  }

  *_parseHyperlinks(iterator: AsyncIterable<unknown>, sheetNo: string): Generator<ParseEvent> {
    this._emitEntry({ type: 'hyperlinks', id: sheetNo });
    const hyperlinksReader = new HyperlinkReader({
      workbook: this,
      id: sheetNo as unknown as number,
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
