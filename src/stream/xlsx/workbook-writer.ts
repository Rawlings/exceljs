import fs from 'fs';
import { NativeZipWriter } from '../../utils/native-zip';

import StreamBuf from '../../utils/stream-buf';

import RelType from '../../xlsx/rel-type';
import StylesXform from '../../xlsx/xform/style/styles-xform';
import SharedStrings from '../../utils/shared-strings';
import DefinedNames from '../../doc/defined-names';

import CoreXform from '../../xlsx/xform/core/core-xform';
import RelationshipsXform from '../../xlsx/xform/core/relationships-xform';
import ContentTypesXform from '../../xlsx/xform/core/content-types-xform';
import AppXform from '../../xlsx/xform/core/app-xform';
import WorkbookXform from '../../xlsx/xform/book/workbook-xform';
import SharedStringsXform from '../../xlsx/xform/strings/shared-strings-xform';

import WorksheetWriter from './worksheet-writer';

// @ts-ignore
import theme1Xml from '../../xlsx/theme1';

class WorkbookWriter {
  created: any;
  modified: any;
  creator: any;
  lastModifiedBy: any;
  lastPrinted: any;
  useSharedStrings: boolean;
  sharedStrings: any;
  styles: any;
  _definedNames: any;
  _worksheets: any[];
  views: any[];
  zipOptions: any;
  stream: any;
  zip: any;
  media: any[];
  mediaIndex: any;
  tables: any[] = [];
  commentRefs: any;
  promise: any;

  constructor(options?: any) {
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
    this.styles = options.useStyles ? new StylesXform(true) : new (StylesXform as any).Mock(true);

    // defined names
    this._definedNames = new DefinedNames();

    this._worksheets = [];
    this.views = [];

    this.zipOptions = options.zip;

    this.media = [];
    this.commentRefs = [];

    this.zip = new NativeZipWriter(this.zipOptions);
    if (options.stream) {
      this.stream = options.stream;
    } else if (options.filename) {
      this.stream = fs.createWriteStream(options.filename);
    } else {
      this.stream = new (StreamBuf as any)();
    }

    // these bits can be added right now
    this.promise = Promise.all([this.addThemes(), this.addOfficeRels()]);
  }

  get definedNames() {
    return this._definedNames;
  }

  _openStream(path: any) {
    const stream = new (StreamBuf as any)({ bufSize: 65536, batch: true });
    this.zip.append(stream, { name: path });
    stream.on('finish', () => {
      stream.emit('zipped');
    });
    return stream;
  }

  _commitWorksheets() {
    const commitWorksheet = function (worksheet: any) {
      if (!worksheet.committed) {
        return new Promise<void>((resolve) => {
          worksheet.stream.on('zipped', () => {
            resolve();
          });
          worksheet.commit();
        });
      }
      return Promise.resolve();
    };
    // if there are any uncommitted worksheets, commit them now and wait
    const promises = this._worksheets.map(commitWorksheet);
    if (promises.length) {
      return Promise.all(promises);
    }
    return Promise.resolve();
  }

  async commit() {
    // commit all worksheets, then add suplimentary files
    await this.promise;
    await this.addMedia();
    await this._commitWorksheets();
    await Promise.all([
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

  addImage(image: any) {
    const id = this.media.length;
    const medium = Object.assign({}, image, {
      type: 'image',
      name: `image${id}.${image.extension}`,
    });
    this.media.push(medium);
    return id;
  }

  getImage(id: any) {
    return this.media[id];
  }

  addWorksheet(name: any, options: any) {
    // it's possible to add a worksheet with different than default
    // shared string handling
    // in fact, it's even possible to switch it mid-sheet
    options = options || {};
    const useSharedStrings =
      options.useSharedStrings !== undefined ? options.useSharedStrings : this.useSharedStrings;

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
      properties: options.properties,
      state: options.state,
      pageSetup: options.pageSetup,
      views: options.views,
      autoFilter: options.autoFilter,
      headerFooter: options.headerFooter,
    });

    this._worksheets[id] = worksheet;
    return worksheet;
  }

  getWorksheet(id: any) {
    if (id === undefined) {
      return this._worksheets.find(() => true);
    }
    if (typeof id === 'number') {
      return this._worksheets[id];
    }
    if (typeof id === 'string') {
      return this._worksheets.find((worksheet) => worksheet && worksheet.name === id);
    }
    return undefined;
  }

  addStyles() {
    return new Promise<void>((resolve) => {
      this.zip.append(this.styles.xml, { name: 'xl/styles.xml' });
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
      this.zip.append(xml, { name: '/_rels/.rels' });
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
            return this.zip.file(medium.filename, { name: filename });
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
        this.zip.append(xml, { name: '/xl/sharedStrings.xml' });
        resolve(undefined);
      });
    }
    return Promise.resolve();
  }

  addWorkbookRels() {
    let count = 1;
    const relationships: any[] = [
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
    this._worksheets.forEach((worksheet: any) => {
      if (worksheet) {
        worksheet.rId = `rId${count++}`;
        relationships.push({
          Id: worksheet.rId,
          Type: RelType.Worksheet,
          Target: `worksheets/sheet${worksheet.id}.xml`,
        });
      }
    });
    return new Promise((resolve) => {
      const xform = new RelationshipsXform();
      const xml = xform.toXml(relationships);
      this.zip.append(xml, { name: '/xl/_rels/workbook.xml.rels' });
      resolve(undefined);
    });
  }

  addWorkbook() {
    const { zip } = this;
    const model = {
      worksheets: this._worksheets.filter(Boolean),
      definedNames: this._definedNames.model,
      views: this.views,
      properties: {},
      calcProperties: {},
    };

    return new Promise((resolve) => {
      const xform = new WorkbookXform();
      xform.prepare(model);
      zip.append(xform.toXml(model), { name: '/xl/workbook.xml' });
      resolve(undefined);
    });
  }

  _finalize() {
    return new Promise((resolve, reject) => {
      try {
        const zipBuffer = this.zip.generateSync();
        if (typeof this.stream.write === 'function') {
          this.stream.write(zipBuffer);
          this.stream.end();
        }
        resolve(this);
      } catch (err: any) {
        reject(err);
      }
    });
  }
}

export default WorkbookWriter;
