import { EventEmitter } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import fs from 'node:fs';
import { XMLParser } from 'fast-xml-parser';
import { ZipReader as JSZip } from '#src/utils/stream/zip';
import iterateStream from '#src/utils/stream/iterate-stream';

import StyleManager from '#src/xlsx/xform/style/styles-xform';
import WorkbookXform from '#src/xlsx/xform/book/workbook-xform';
import RelationshipsXform from '#src/xlsx/xform/core/relationships-xform';

import WorksheetReader from '#src/stream/xlsx/worksheet-reader';
import HyperlinkReader from '#src/stream/xlsx/hyperlink-reader';

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

class WorkbookReader extends EventEmitter {
  static Options: any;
  input: any;
  options: any;
  styles: any;
  stream: any;
  sharedStrings: any;
  workbookRels: any;
  model: any;
  properties: any;

  constructor(input?: any, options: any = {}) {
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
    this.styles.init();
    this.sharedStrings = [];
    this.model = {};
  }

  _getStream(input: any) {
    if (input instanceof Readable) {
      return input;
    }
    if (typeof input === 'string') {
      return fs.createReadStream(input);
    }
    throw new Error(`Could not recognise input: ${input}`);
  }

  async read(input?: any, options?: any) {
    try {
      for await (const item of this.parse(input, options)) {
        const { eventType, value }: any = item;
        switch (eventType) {
          case 'shared-strings':
            this.emit(eventType, value);
            break;
          case 'worksheet':
            this.emit(eventType, value);
            await value.read();
            break;
          case 'hyperlinks':
            this.emit(eventType, value);
            break;
        }
      }
      this.emit('end');
      this.emit('finished');
    } catch (error: any) {
      this.emit('error', error);
    }
  }

  async *[Symbol.asyncIterator]() {
    for await (const item of this.parse(undefined, undefined)) {
      const { eventType, value }: any = item;
      if (eventType === 'worksheet') {
        yield value;
      }
    }
  }

  async *parse(input?: any, options?: any) {
    if (options) this.options = options;
    const stream = (this.stream = this._getStream(input || this.input));
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const zip = await JSZip.loadAsync(Buffer.concat(chunks));
    const entries: any[] = [];
    for (const [path, file] of Object.entries(zip.files) as any[]) {
      if (file.dir) continue;
      const buf = await file.async('nodebuffer');
      const entry: any = Readable.from(buf);
      entry.path = path;
      entries.push(entry);
    }

    const waitingWorkSheets: any[] = [];
    for (const entry of entries) {
      let match: any;
      let sheetNo: any;
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
            sheetNo = match[1];
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
                entry.pipe(tempStream);
                return tempStream.on('finish', () => {
                  return resolve(undefined);
                });
              });
            }
          } else if (entry.path.match(/xl\/worksheets\/_rels\/sheet\d+[.]xml.rels/)) {
            match = entry.path.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml.rels/);
            sheetNo = match[1];
            yield* this._parseHyperlinks(iterateStream(entry), sheetNo);
          }
          break;
      }
      if (typeof entry.autodrain === 'function') {
        entry.autodrain();
      }
    }

    for (const { sheetNo, path, tempFileCleanupCallback } of waitingWorkSheets) {
      let fileStream: any = fs.createReadStream(path);
      if (!fileStream[Symbol.asyncIterator]) {
        fileStream = fileStream.pipe(new PassThrough());
      }
      yield* this._parseWorksheet(fileStream, sheetNo);
      tempFileCleanupCallback();
    }
  }

  _emitEntry(payload: any) {
    if (this.options.entries === 'emit') {
      this.emit('entry', payload);
    }
  }

  async _parseRels(entry: any) {
    const xform = new RelationshipsXform();
    this.workbookRels = await xform.parseStream(iterateStream(entry));
  }

  async _parseWorkbook(entry: any) {
    this._emitEntry({ type: 'workbook' });

    const workbook = new WorkbookXform();
    await workbook.parseStream(iterateStream(entry));

    this.properties = workbook.map.workbookPr;
    this.model = workbook.model;
  }

  async *_parseSharedStrings(entry: any) {
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

    const xml = await collectXml(iterateStream(entry));
    if (!xml) return;

    const doc = sharedStringsParser.parse(xml);
    const sst = doc.sst;
    if (!sst || !sst.si) return;

    let index = 0;
    for (const si of sst.si as any[]) {
      let text: string | null = null;
      const richText: any[] = [];

      // Plain text: <si><t>...</t></si>
      if (si.t !== undefined) {
        text = getNodeText(si.t);
      }

      // Rich text runs: <si><r>...</r></si>
      if (si.r) {
        for (const run of si.r as any[]) {
          let font: any = null;
          const rPr = run.rPr;
          if (rPr) {
            font = {};
            if (rPr.b !== undefined) font.bold = true;
            if (rPr.i !== undefined) font.italic = true;
            if (rPr.u !== undefined) font.underline = true;
            if (rPr.outline !== undefined) font.outline = true;
            if (rPr.strike !== undefined) font.strike = true;
            if (rPr.sz !== undefined) {
              font.size = parseInt(typeof rPr.sz === 'object' ? rPr.sz.val : String(rPr.sz), 10);
            }
            if (rPr.rFont !== undefined) {
              font.name =
                typeof rPr.rFont === 'object'
                  ? (rPr.rFont.val ?? getNodeText(rPr.rFont))
                  : String(rPr.rFont);
            }
            if (rPr.family !== undefined) {
              font.family = parseInt(
                typeof rPr.family === 'object' ? rPr.family.val : String(rPr.family),
                10
              );
            }
            if (rPr.charset !== undefined) {
              font.charset = parseInt(
                typeof rPr.charset === 'object' ? rPr.charset.val : String(rPr.charset),
                10
              );
            }
            if (rPr.vertAlign !== undefined) {
              font.vertAlign =
                typeof rPr.vertAlign === 'object' ? rPr.vertAlign.val : String(rPr.vertAlign);
            }
            if (rPr.color !== undefined) {
              const c = rPr.color;
              font.color = {};
              if (c.rgb) font.color.argb = c.rgb;
              if (c.argb) font.color.argb = c.argb;
              if (c.theme !== undefined) font.color.theme = c.theme;
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

  async _parseStyles(entry: any) {
    this._emitEntry({ type: 'styles' });
    if (this.options.styles === 'cache') {
      this.styles = new StyleManager();
      await this.styles.parseStream(iterateStream(entry));
    }
  }

  *_parseWorksheet(iterator: any, sheetNo: any) {
    this._emitEntry({ type: 'worksheet', id: sheetNo });
    const worksheetReader: any = new WorksheetReader({
      workbook: this,
      id: sheetNo,
      iterator,
      options: this.options,
    });

    const matchingRel = (this.workbookRels || []).find(
      (rel: any) => rel.Target === `worksheets/sheet${sheetNo}.xml`
    );
    const matchingSheet =
      matchingRel && (this.model.sheets || []).find((sheet: any) => sheet.rId === matchingRel.Id);
    if (matchingSheet) {
      worksheetReader.id = matchingSheet.id;
      worksheetReader.name = matchingSheet.name;
      worksheetReader.state = matchingSheet.state;
    }
    if (this.options.worksheets === 'emit') {
      yield { eventType: 'worksheet', value: worksheetReader };
    }
  }

  *_parseHyperlinks(iterator: any, sheetNo: any) {
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
