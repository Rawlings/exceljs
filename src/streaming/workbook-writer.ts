import fs from 'node:fs';
import { PassThrough } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { ZipWriter } from '../utils/stream/zip';

import RelType from '../formats/xlsx/rel-type';
import StylesXform from '../formats/xlsx/xml/style/styles-xform';
import SharedStrings from '../utils/data/shared-strings';
import DefinedNames from '../core/defined-names';

import CoreXform from '../formats/xlsx/xml/core/core-xform';
import RelationshipsXform from '../formats/xlsx/xml/core/relationships-xform';
import ContentTypesXform from '../formats/xlsx/xml/core/content-types-xform';
import AppXform from '../formats/xlsx/xml/core/app-xform';
import WorkbookXform from '../formats/xlsx/xml/book/workbook-xform';
import SharedStringsXform from '../formats/xlsx/xml/strings/shared-strings-xform';

import WorksheetWriter from './worksheet-writer';
import type {
  WorksheetProperties,
  WorksheetState,
  PageSetup,
  WorksheetView,
  AutoFilter,
  HeaderFooter,
} from '../core/worksheet';

// @ts-ignore
import theme1Xml from '../formats/xlsx/theme1';

export interface WorkbookWriterOptions {
  created?: Date;
  modified?: Date;
  creator?: string;
  lastModifiedBy?: string;
  lastPrinted?: Date;
  useSharedStrings?: boolean;
  useStyles?: boolean;
  zip?: Record<string, unknown>;
  stream?: NodeJS.WritableStream;
  filename?: string;
  [key: string]: unknown;
}

interface MediaItem {
  type: string;
  name?: string;
  filename?: string;
  buffer?: unknown;
  base64?: string;
  extension?: string;
  [key: string]: unknown;
}

export class WorkbookWriter {
  created: Date;
  modified: Date;
  creator: string;
  lastModifiedBy: string;
  lastPrinted: Date | undefined;
  useSharedStrings: boolean;
  sharedStrings: SharedStrings;
  styles: StylesXform;
  _definedNames: DefinedNames;
  _worksheets: (WorksheetWriter | undefined)[];
  views: unknown[];
  zipOptions: Record<string, unknown> | undefined;
  stream: NodeJS.WritableStream & { write?: unknown };
  zip: ZipWriter;
  media: MediaItem[];
  mediaIndex: unknown;
  tables: unknown[] = [];
  commentRefs: unknown[];
  promise: Promise<unknown>;

  constructor(options?: WorkbookWriterOptions) {
    options = options || {};

    this.created = options.created || new Date();
    this.modified = options.modified || this.created;
    this.creator = options.creator || 'ExcelJS';
    this.lastModifiedBy = options.lastModifiedBy || 'ExcelJS';
    this.lastPrinted = options.lastPrinted;

    // using shared strings creates a smaller xlsx file but may use more memory
    this.useSharedStrings = options.useSharedStrings || false;
    this.sharedStrings = new SharedStrings();

    // style manager
    this.styles = options.useStyles
      ? new StylesXform(true)
      : new (StylesXform as unknown as { Mock: new (v: boolean) => StylesXform }).Mock(true);

    // defined names
    this._definedNames = new DefinedNames();

    this._worksheets = [];
    this.views = [];

    this.zipOptions = options.zip;

    this.media = [];
    this.commentRefs = [];

    this.zip = new ZipWriter(this.zipOptions);

    if (options.stream) {
      this.stream = options.stream;
    } else if (options.filename) {
      this.stream = fs.createWriteStream(options.filename);
    } else {
      this.stream = new PassThrough();
    }

    // these bits can be added right now
    this.promise = Promise.all([this.addThemes(), this.addOfficeRels()]);
  }

  get definedNames() {
    return this._definedNames;
  }

  _openStream(path: string): PassThrough {
    const cleanPath = typeof path === 'string' ? path.replace(/^\//, '') : path;
    const stream = new PassThrough();
    this.zip.append(buffer(stream), { name: cleanPath });
    stream.on('finish', () => {
      stream.emit('zipped');
    });
    return stream;
  }

  _commitWorksheets() {
    const commitWorksheet = function (worksheet: WorksheetWriter) {
      if (!(worksheet as unknown as { committed: boolean }).committed) {
        return new Promise<void>((resolve) => {
          (worksheet as unknown as { stream: { on(e: string, cb: () => void): void } }).stream.on(
            'zipped',
            () => {
              resolve();
            }
          );
          worksheet.commit();
        });
      }
      return Promise.resolve();
    };
    // if there are any uncommitted worksheets, commit them now and wait
    const promises = (this._worksheets as WorksheetWriter[]).map(commitWorksheet);
    if (promises.length) {
      return Promise.all(promises);
    }
    return Promise.resolve();
  }

  async commit() {
    // commit all worksheets, then add suplimentary files
    await this.promise;
    await this._commitWorksheets();
    await this.addMedia();
    await Promise.all([
      this.addOfficeRels(),
      this.addThemes(),
      this.addContentTypes(),
      this.addApp(),
      this.addCore(),
      this.addSharedStrings(),
      this.addStyles(),
      this.addWorkbookRels(),
    ]);
    await this.addWorkbook();
    return this._finalize();
  }

  get nextId() {
    // find the next unique spot to add worksheet
    let i;
    for (i = 1; i < this._worksheets.length; i++) {
      if (!this._worksheets[i]) {
        return i;
      }
    }
    return this._worksheets.length || 1;
  }

  addImage(image: { extension?: string; [key: string]: unknown }): number {
    const id = this.media.length;
    const medium = Object.assign({}, image, {
      type: 'image',
      name: `image${id}.${image.extension}`,
    });
    this.media.push(medium);
    return id;
  }

  getImage(id: number): MediaItem {
    return this.media[id];
  }

  addWorksheet(name?: string, options?: Record<string, unknown>): WorksheetWriter {
    // it's possible to add a worksheet with different than default
    // shared string handling
    // in fact, it's even possible to switch it mid-sheet
    options = options || {};
    const useSharedStrings: boolean =
      options.useSharedStrings !== undefined
        ? (options.useSharedStrings as boolean)
        : this.useSharedStrings;

    if (options.tabColor) {
      // eslint-disable-next-line no-console
      console.trace('tabColor option has moved to { properties: tabColor: {...} }');
      options.properties = Object.assign(
        {
          tabColor: options.tabColor,
        },
        options.properties
      );
    }

    const id = this.nextId;
    name = name || `sheet${id}`;

    const worksheet = new WorksheetWriter({
      id,
      name,
      workbook: this,
      useSharedStrings,
      properties: options.properties as WorksheetProperties | undefined,
      state: options.state as WorksheetState | undefined,
      pageSetup: options.pageSetup as Partial<PageSetup> | undefined,
      views: options.views as Array<Partial<WorksheetView>> | undefined,
      autoFilter: options.autoFilter as AutoFilter | undefined,
      headerFooter: options.headerFooter as Partial<HeaderFooter> | undefined,
    });

    this._worksheets[id] = worksheet;
    return worksheet;
  }

  getWorksheet(id?: number | string): WorksheetWriter | undefined {
    if (id === undefined) {
      return this._worksheets.find(Boolean);
    }
    if (typeof id === 'number') {
      return this._worksheets[id] || this._worksheets.find((ws) => ws && ws.id === id);
    }
    if (typeof id === 'string') {
      const byName = this._worksheets.find(
        (worksheet) => worksheet && (worksheet as unknown as { name: string }).name === id
      );
      if (byName) return byName;
      const num = parseInt(id, 10);
      if (!Number.isNaN(num)) {
        return this._worksheets[num] || this._worksheets.find((ws) => ws && ws.id === num);
      }
    }
    return undefined;
  }

  addStyles() {
    return new Promise<void>((resolve) => {
      this.zip.append((this.styles as unknown as { xml: unknown }).xml, { name: 'xl/styles.xml' });
      resolve();
    });
  }

  addThemes() {
    return new Promise<void>((resolve) => {
      this.zip.append(theme1Xml, { name: 'xl/theme/theme1.xml' });
      resolve();
    });
  }

  addOfficeRels() {
    return new Promise<void>((resolve) => {
      const xform = new RelationshipsXform();
      const xml = xform.toXml([
        { Id: 'rId1', Type: RelType.OfficeDocument, Target: 'xl/workbook.xml' },
        { Id: 'rId2', Type: RelType.CoreProperties, Target: 'docProps/core.xml' },
        { Id: 'rId3', Type: RelType.ExtenderProperties, Target: 'docProps/app.xml' },
      ]);
      this.zip.append(xml, { name: '_rels/.rels' });
      resolve();
    });
  }

  addContentTypes() {
    return new Promise<void>((resolve) => {
      const model = {
        worksheets: this._worksheets.filter(Boolean),
        sharedStrings: this.sharedStrings,
        commentRefs: this.commentRefs,
        media: this.media,
      };
      const xform = new ContentTypesXform();
      const xml = xform.toXml(model);
      this.zip.append(xml, { name: '[Content_Types].xml' });
      resolve();
    });
  }

  addMedia() {
    return Promise.all(
      this.media.map((medium) => {
        if (medium.type === 'image') {
          const filename = `xl/media/${medium.name}`;
          if (medium.filename) {
            return this.zip.append(buffer(fs.createReadStream(medium.filename)), {
              name: filename,
            });
          }
          if (medium.buffer) {
            return this.zip.append(medium.buffer, { name: filename });
          }
          if (medium.base64) {
            const dataimg64 = medium.base64;
            const content = dataimg64.substring(dataimg64.indexOf(',') + 1);
            return this.zip.append(content, { name: filename, base64: true });
          }
        }
        throw new Error('Unsupported media');
      })
    );
  }

  addApp() {
    return new Promise((resolve) => {
      const model = {
        worksheets: this._worksheets.filter(Boolean),
      };
      const xform = new AppXform();
      const xml = xform.toXml(model);
      this.zip.append(xml, { name: 'docProps/app.xml' });
      resolve(undefined);
    });
  }

  addCore() {
    return new Promise((resolve) => {
      const coreXform = new CoreXform();
      const xml = coreXform.toXml(this);
      this.zip.append(xml, { name: 'docProps/core.xml' });
      resolve(undefined);
    });
  }

  addSharedStrings() {
    if (this.sharedStrings.count) {
      return new Promise((resolve) => {
        const sharedStringsXform = new SharedStringsXform();
        const xml = sharedStringsXform.toXml(this.sharedStrings);
        this.zip.append(xml, { name: 'xl/sharedStrings.xml' });
        resolve(undefined);
      });
    }
    return Promise.resolve();
  }

  addWorkbookRels() {
    let count = 1;
    const relationships: Record<string, unknown>[] = [
      { Id: `rId${count++}`, Type: RelType.Styles, Target: 'styles.xml' },
      { Id: `rId${count++}`, Type: RelType.Theme, Target: 'theme/theme1.xml' },
    ];
    if (this.sharedStrings.count) {
      relationships.push({
        Id: `rId${count++}`,
        Type: RelType.SharedStrings,
        Target: 'sharedStrings.xml',
      });
    }
    this._worksheets.forEach((worksheet) => {
      if (worksheet) {
        (worksheet as unknown as { rId: string }).rId = `rId${count++}`;
        relationships.push({
          Id: (worksheet as unknown as { rId: string }).rId,
          Type: RelType.Worksheet,
          Target: `worksheets/sheet${(worksheet as unknown as { id: number }).id}.xml`,
        });
      }
    });
    return new Promise((resolve) => {
      const xform = new RelationshipsXform();
      const xml = xform.toXml(relationships);
      this.zip.append(xml, { name: 'xl/_rels/workbook.xml.rels' });
      resolve(undefined);
    });
  }

  addWorkbook() {
    const { zip } = this;
    const model = {
      worksheets: this._worksheets.filter(Boolean),
      definedNames: (this._definedNames as unknown as { model: unknown }).model,
      views: this.views,
      properties: {},
      calcProperties: {},
    };

    return new Promise((resolve) => {
      const xform = new WorkbookXform();
      xform.prepare(model);
      zip.append(xform.toXml(model), { name: 'xl/workbook.xml' });
      resolve(undefined);
    });
  }

  async _finalize() {
    const zipBuffer = await this.zip.generateAsync();
    if (typeof (this.stream as unknown as { write?: unknown }).write === 'function') {
      await new Promise<void>((resolve, reject) => {
        const stream = this.stream as unknown as {
          once(e: 'finish', cb: () => void): void;
          once(e: 'error', cb: (err?: unknown) => void): void;
          write(b: unknown): void;
          end(): void;
        };
        stream.once('finish', resolve);
        stream.once('error', reject);
        stream.write(zipBuffer);
        stream.end();
      });
    }
    return this;
  }
}

export default WorkbookWriter;
