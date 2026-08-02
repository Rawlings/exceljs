import fs from 'fs';
import type { PathLike } from 'fs';
import { unzip, ZipWriter } from '../../utils/stream/zip';
import { PassThrough, type Readable } from 'stream';

import XmlStream from '../../utils/stream/xml-stream';

import StylesXform from './xml/style/styles-xform';

import CoreXform from './xml/core/core-xform';
import SharedStringsXform from './xml/strings/shared-strings-xform';
import RelationshipsXform from './xml/core/relationships-xform';
import type { RelationshipModel } from './xml/core/relationship-xform';
import ContentTypesXform from './xml/core/content-types-xform';
import AppXform from './xml/core/app-xform';
import WorkbookXform from './xml/book/workbook-xform';
import WorksheetXform from './xml/sheet/worksheet-xform';
import type { WorksheetXformModel } from './xml/sheet/worksheet-xform';
import DrawingXform from './xml/drawing/drawing-xform';
import type { DrawingModel } from './xml/drawing/drawing-xform';
import TableXform from './xml/table/table-xform';
import type { TableModel } from './xml/table/table-xform';
import PivotCacheRecordsXform from './xml/pivot-table/pivot-cache-records-xform';
import PivotCacheDefinitionXform from './xml/pivot-table/pivot-cache-definition-xform';
import PivotTableXform from './xml/pivot-table/pivot-table-xform';
import CommentsXform from './xml/comment/comments-xform';
import VmlNotesXform from './xml/comment/vml-notes-xform';
import type { VmlNotesModel } from './xml/comment/vml-notes-xform';
import RelType from './rel-type';
import type Workbook from '../../core/workbook';
import type { WorkbookModel } from '../../core/workbook';

// @ts-ignore
import theme1Xml from './theme1';

function fsReadFileAsync(
  filename: PathLike,
  options?: { encoding?: BufferEncoding | null; flag?: string } | BufferEncoding | null
): Promise<Buffer | string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, options, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

// A parse-time table model: `target`/`id` are assigned by xlsx.ts itself
// before handing the table off to TableXform, not part of its own contract.
interface ParseTableModel extends TableModel {
  target?: string;
}

// `name`/`rels` are assigned by xlsx.ts around the DrawingModel it hands
// off to DrawingXform, not part of that xform's own contract.
interface ParseDrawingModel extends DrawingModel {
  name: string;
  rels?: RelationshipModel[];
}

interface ParseMedium {
  type: string;
  name: string;
  extension: string;
  buffer?: Buffer;
  filename?: string;
  base64?: string;
}

// Zip entries are either a real Readable (media/theme parts, unzipped via
// PassThrough) or, for the legacy JSZip-style input this branch was
// written against, an object exposing an async('nodebuffer') reader
// instead of a stream `read()`. Only one of the two is ever present.
interface ZipEntryStream {
  read?: () => Buffer | null;
  async?: (type: string) => Promise<Buffer>;
}

// The stream/xform pipeline (see src/formats/xlsx/xml/base-xform.ts) is
// intentionally `any`-typed end to end, so the objects flowing through it
// carry far more properties than the public WorkbookModel/WorksheetModel
// shapes declare (those are trimmed, public-facing views). This is the
// working superset used only within this file while parsing/assembling.
interface ParseWorksheetModel {
  [key: string]: unknown;
  id?: number;
  sheetNo?: number | string;
  relationships?: unknown;
  rels?: RelationshipModel[];
  rId?: string;
  tables: ParseTableModel[];
  comments: unknown[];
  drawing?: { name: string; rels: RelationshipModel[]; anchors: unknown[] };
}

interface ParseWorkbookModel extends Partial<WorkbookModel> {
  [key: string]: unknown;
  worksheets: ParseWorksheetModel[];
  worksheetHash: Record<string, ParseWorksheetModel>;
  worksheetRels: Record<string, RelationshipModel[]>;
  globalRels?: RelationshipModel[];
  workbookRels?: RelationshipModel[];
  sharedStrings?: SharedStringsXform;
  styles?: StylesXform;
  mediaIndex: Record<string, number>;
  media: ParseMedium[];
  drawings: Record<string, ParseDrawingModel>;
  drawingRels: Record<string, RelationshipModel[]>;
  comments: Record<string, unknown>;
  tables: Record<string, ParseTableModel>;
  vmlDrawings: Record<string, unknown>;
  themes: Record<string, string>;
}

// The write path starts from Workbook#model's getter output (see
// src/core/workbook.ts), whose properties are `Record<string, unknown>`
// (that type is intentionally loose there too, for the same reason as
// above). prepareModel() then mutates it in place, adding write-only
// fields (styles, sharedStrings, drawings-as-array, commentRefs, use*).
// A plain index-signature record is the honest type for this object
// through the write pipeline; call sites narrow locally where needed.
type WriteModel = Record<string, unknown>;

export interface JSZipGeneratorOptions {
  compression: 'STORE' | 'DEFLATE';
  compressionOptions: null | {
    level: number;
  };
}

export interface XlsxReadOptions {
  ignoreNodes: string[];
  maxRows?: number;
  maxCols?: number;
  base64?: boolean;
  [key: string]: unknown;
}

export interface XlsxWriteOptions {
  zip: Partial<JSZipGeneratorOptions>;
  useStyles?: boolean;
  useSharedStrings?: boolean;
  base64?: boolean;
  [key: string]: unknown;
}

export class XLSX {
  workbook: Workbook;
  static RelType: typeof RelType;

  constructor(workbook?: Workbook) {
    this.workbook = workbook as Workbook;
  }

  // ===============================================================================
  // Workbook
  // =========================================================================
  // Read

  async readFile(filename: string, options?: Partial<XlsxReadOptions>) {
    if (!fs.existsSync(filename)) {
      throw new Error(`File not found: ${filename}`);
    }
    const stream = fs.createReadStream(filename);
    try {
      const workbook = await this.read(stream, options);
      stream.close();
      return workbook;
    } catch (error) {
      stream.close();
      throw error;
    }
  }

  parseRels(stream: Readable | string) {
    const xform = new RelationshipsXform();
    return xform.parseStream(stream);
  }

  parseWorkbook(stream: Readable | string) {
    const xform = new WorkbookXform();
    return xform.parseStream(stream);
  }

  parseSharedStrings(stream: Readable | string) {
    const xform = new SharedStringsXform();
    return xform.parseStream(stream);
  }

  reconcile(model: ParseWorkbookModel, options: Partial<XlsxReadOptions> | undefined) {
    const workbookXform = new WorkbookXform();
    const worksheetXform = new WorksheetXform(options);
    const drawingXform = new DrawingXform();
    const tableXform = new TableXform();

    workbookXform.reconcile(model);

    // reconcile drawings with their rels
    interface DrawingHyperlinks {
      rId?: string;
      hyperlink?: string;
    }
    interface DrawingReconcileOptions {
      media: unknown;
      mediaIndex: unknown;
      rels?: Record<string, RelationshipModel>;
    }
    const drawingOptions: DrawingReconcileOptions = {
      media: model.media,
      mediaIndex: model.mediaIndex,
    };
    Object.keys(model.drawings).forEach((name) => {
      const drawing = model.drawings[name];
      const drawingRel = model.drawingRels[name];
      if (drawingRel) {
        drawingOptions.rels = drawingRel.reduce<Record<string, RelationshipModel>>((o, rel) => {
          if (rel.Id) o[rel.Id] = rel;
          return o;
        }, {});
        (drawing.anchors || []).forEach((anchor) => {
          const picture = anchor.picture as { hyperlinks?: DrawingHyperlinks } | undefined;
          const hyperlinks = picture?.hyperlinks;
          const rel = hyperlinks?.rId && drawingOptions.rels?.[hyperlinks.rId];
          if (hyperlinks && rel) {
            hyperlinks.hyperlink = rel.Target;
            delete hyperlinks.rId;
          }
        });
        drawingXform.reconcile(drawing, drawingOptions);
      }
    });

    // reconcile tables with the default styles
    const tableOptions = {
      styles: model.styles,
    };
    Object.values(model.tables).forEach((table) => {
      tableXform.reconcile(table, tableOptions);
    });

    const sheetOptions = {
      styles: model.styles,
      sharedStrings: model.sharedStrings,
      media: model.media,
      mediaIndex: model.mediaIndex,
      date1904: model.properties && model.properties.date1904,
      drawings: model.drawings,
      comments: model.comments,
      tables: model.tables,
      vmlDrawings: model.vmlDrawings,
    };
    model.worksheets.forEach((worksheet) => {
      worksheet.relationships = worksheet.sheetNo ? model.worksheetRels[worksheet.sheetNo] : undefined;
      // ParseWorksheetModel and WorksheetXformModel describe the same
      // runtime object from two different vantage points (see the file
      // header comment); neither TS type has an index signature so they
      // aren't structurally assignable despite being compatible in practice.
      worksheetXform.reconcile(
        worksheet as unknown as WorksheetXformModel,
        sheetOptions as unknown as Parameters<typeof worksheetXform.reconcile>[1]
      );
    });

    // delete unnecessary parts
    const transient = model as Record<string, unknown>;
    delete transient.worksheetHash;
    delete transient.worksheetRels;
    delete transient.globalRels;
    delete transient.sharedStrings;
    delete transient.workbookRels;
    delete transient.sheetDefs;
    delete transient.styles;
    delete transient.mediaIndex;
    delete transient.drawings;
    delete transient.drawingRels;
    delete transient.vmlDrawings;
  }

  async _processWorksheetEntry(
    stream: Readable | string,
    model: ParseWorkbookModel,
    sheetNo: string,
    options: Partial<XlsxReadOptions> | undefined,
    path: string
  ) {
    const xform = new WorksheetXform(options);
    const worksheet = await xform.parseStream(stream);
    if (worksheet) {
      worksheet.sheetNo = /^\d+$/.test(sheetNo) ? parseInt(sheetNo, 10) : sheetNo;
      model.worksheetHash[path] = worksheet;
      model.worksheets.push(worksheet);
    }
  }

  async _processCommentEntry(stream: Readable | string, model: ParseWorkbookModel, name: string) {
    const xform = new CommentsXform();
    const comments = await xform.parseStream(stream);
    model.comments[`../${name}.xml`] = comments;
  }

  async _processTableEntry(stream: Readable | string, model: ParseWorkbookModel, name: string) {
    const xform = new TableXform();
    const table = await xform.parseStream(stream);
    model.tables[`../tables/${name}.xml`] = table;
  }

  async _processWorksheetRelsEntry(
    stream: Readable | string,
    model: ParseWorkbookModel,
    sheetNo: string
  ) {
    const xform = new RelationshipsXform();
    const relationships = await xform.parseStream(stream);
    const key = /^\d+$/.test(sheetNo) ? String(parseInt(sheetNo, 10)) : sheetNo;
    model.worksheetRels[key] = relationships;
  }

  async _processMediaEntry(entry: ZipEntryStream, model: ParseWorkbookModel, filename: string) {
    const lastDot = filename.lastIndexOf('.');
    // if we can't determine extension, ignore it
    if (lastDot >= 1) {
      const extension = filename.substr(lastDot + 1);
      const name = filename.substr(0, lastDot);
      let buffer: Buffer;
      if (typeof entry.read === 'function') {
        const chunks: Buffer[] = [];
        let chunk: Buffer | null;
        while ((chunk = entry.read()) !== null) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      } else {
        buffer = await entry.async!('nodebuffer');
      }
      model.mediaIndex[filename] = model.media.length;
      model.mediaIndex[name] = model.media.length;
      const medium = {
        type: 'image',
        name,
        extension,
        buffer,
      };
      model.media.push(medium);
    }
  }

  async _processDrawingEntry(entry: Readable | string, model: ParseWorkbookModel, name: string) {
    const xform = new DrawingXform();
    const drawing = await xform.parseStream(entry);
    model.drawings[name] = drawing;
  }

  async _processDrawingRelsEntry(
    entry: Readable | string,
    model: ParseWorkbookModel,
    name: string
  ) {
    const xform = new RelationshipsXform();
    const relationships = await xform.parseStream(entry);
    model.drawingRels[name] = relationships;
  }

  async _processVmlDrawingEntry(
    entry: Readable | string,
    model: ParseWorkbookModel,
    name: string
  ) {
    const xform = new VmlNotesXform();
    const vmlDrawing = await xform.parseStream(entry);
    model.vmlDrawings[`../drawings/${name}.vml`] = vmlDrawing;
  }

  async _processThemeEntry(entry: ZipEntryStream, model: ParseWorkbookModel, name: string) {
    const buffer = typeof entry.read === 'function' ? entry.read() : await entry.async!('nodebuffer');
    model.themes[name] = buffer ? buffer.toString() : '';
  }

  /**
   * @deprecated since version 4.0. You should use `#read` instead. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md
   */
  createInputStream(): never {
    throw new Error(
      '`XLSX#createInputStream` is deprecated. You should use `XLSX#read` instead. This method will be removed in version 5.0. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md'
    );
  }

  async read(stream: Readable, options?: Partial<XlsxReadOptions>) {
    // TODO: Remove once node v8 is deprecated
    // Detect and upgrade old streams
    if (!stream[Symbol.asyncIterator] && stream.pipe) {
      stream = stream.pipe(new PassThrough());
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return this.load(Buffer.concat(chunks), options);
  }

  async load(data: Buffer | string, options?: Partial<XlsxReadOptions>) {
    let buffer: Buffer;
    if (options && options.base64) {
      buffer = Buffer.from(data.toString(), 'base64');
    } else {
      buffer = data as Buffer;
    }

    const model: ParseWorkbookModel = {
      worksheets: [],
      worksheetHash: {},
      worksheetRels: {},
      themes: {},
      media: [],
      mediaIndex: {},
      drawings: {},
      drawingRels: {},
      comments: {},
      tables: {},
      vmlDrawings: {},
    };

    const files = unzip(buffer);
    const entries = Object.entries(files)
      .map(([name, content]) => ({ name, content, dir: name.endsWith('/') }))
      .sort((a, b) => {
        const getPriority = (rawName: string) => {
          const name = rawName.replace(/^\//, '');
          if (name === '_rels/.rels') return 1;
          if (name === 'docProps/app.xml' || name === 'docProps/core.xml') return 2;
          if (name === 'xl/_rels/workbook.xml.rels') return 3;
          if (name === 'xl/workbook.xml') return 4;
          if (name === 'xl/sharedStrings.xml') return 5;
          if (name === 'xl/styles.xml') return 6;
          if (name.match(/^xl\/worksheets\/_rels\//)) return 7;
          if (name.match(/^xl\/drawings\/_rels\//)) return 8;
          if (name.match(/^xl\/drawings\//)) return 9;
          if (name.match(/^xl\/media\//)) return 10;
          if (name.match(/^xl\/worksheets\/[^/]+\.xml$/)) return 11;
          return 15;
        };
        return getPriority(a.name) - getPriority(b.name);
      });
    for (const entry of entries) {
      /* eslint-disable no-await-in-loop */
      if (!entry.dir) {
        let entryName = entry.name;
        if (entryName[0] === '/') {
          entryName = entryName.substr(1);
        }
        let stream: Readable | string;
        if (
          entryName.match(/xl\/media\//) ||
          // themes are not parsed as stream
          entryName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/)
        ) {
          const passThrough = new PassThrough();
          passThrough.end(entry.content);
          stream = passThrough;
        } else {
          stream = entry.content.toString('utf8');
        }
        const keyName = entryName.replace(/^\//, '');
        switch (keyName) {
          case '_rels/.rels': {
            const relsXform = new RelationshipsXform();
            model.globalRels = await relsXform.parseStream(stream);
            break;
          }

          case 'xl/workbook.xml': {
            const workbookXform = new WorkbookXform();
            const workbook = await workbookXform.parseStream(stream);
            if (workbook) {
              model.sheets = workbook.sheets;
              model.definedNames = workbook.definedNames;
              model.views = workbook.views;
              model.properties = workbook.properties;
              model.calcProperties = workbook.calcProperties;
            }
            break;
          }

          case 'xl/_rels/workbook.xml.rels': {
            const relsXform = new RelationshipsXform();
            model.workbookRels = await relsXform.parseStream(stream);
            break;
          }

          case 'xl/sharedStrings.xml':
            model.sharedStrings = new SharedStringsXform();
            await model.sharedStrings.parseStream(stream);
            break;

          case 'xl/styles.xml':
            model.styles = new StylesXform();
            await model.styles.parseStream(stream);
            break;

          case 'docProps/app.xml': {
            const appXform = new AppXform();
            const appProperties = await appXform.parseStream(stream);
            if (appProperties) {
              model.company = appProperties.company;
              model.manager = appProperties.manager;
            }
            break;
          }

          case 'docProps/core.xml': {
            const coreXform = new CoreXform();
            const coreProperties = await coreXform.parseStream(stream);
            if (coreProperties) {
              Object.assign(model, coreProperties);
            }
            break;
          }

          default: {
            let match = keyName.match(/xl\/worksheets\/sheet(\d+)[.]xml/);
            if (!match) {
              match = keyName.match(/xl\/worksheets\/(sheet\d+|[^/]+)[.]xml/);
            }
            if (match) {
              await this._processWorksheetEntry(stream, model, match[1], options, keyName);
              break;
            }
            match = keyName.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml.rels/);
            if (!match) {
              match = keyName.match(/xl\/worksheets\/_rels\/(sheet\d+|[^/]+)[.]xml.rels/);
            }
            if (match) {
              await this._processWorksheetRelsEntry(stream, model, match[1]);
              break;
            }
            match = keyName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/);
            if (match) {
              // themes are always parsed from the PassThrough branch above
              await this._processThemeEntry(stream as Readable, model, match[1]);
              break;
            }
            match = keyName.match(/xl\/media\/([^/]+)$/);
            if (match) {
              // media entries are always parsed from the PassThrough branch above
              await this._processMediaEntry(stream as Readable, model, match[1]);
              break;
            }
            match = keyName.match(/xl\/drawings\/([a-zA-Z0-9]+)[.]xml/);
            if (match) {
              await this._processDrawingEntry(stream, model, match[1]);
              break;
            }
            match = keyName.match(/xl\/(comments\d+)[.]xml/);
            if (match) {
              await this._processCommentEntry(stream, model, match[1]);
              break;
            }
            match = keyName.match(/xl\/tables\/(table\d+)[.]xml/);
            if (match) {
              await this._processTableEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/drawings\/_rels\/([a-zA-Z0-9]+)[.]xml[.]rels/);
            if (match) {
              await this._processDrawingRelsEntry(stream, model, match[1]);
              break;
            }
            match = entryName.match(/xl\/drawings\/(vmlDrawing\d+)[.]vml/);
            if (match) {
              await this._processVmlDrawingEntry(stream, model, match[1]);
              break;
            }
          }
        }
      }
    }

    this.reconcile(model, options);

    // apply model
    // ParseWorkbookModel's fields are optional since they're populated
    // incrementally while parsing; by this point reconcile() has filled in
    // everything WorkbookModel requires.
    this.workbook.model = model as unknown as WorkbookModel;
    return this.workbook;
  }

  // =========================================================================
  // Write

  async addMedia(zip: ZipWriter, model: WriteModel) {
    const media = model.media as ParseMedium[];
    await Promise.all(
      media.map(async (medium) => {
        if (medium.type === 'image') {
          const filename = `xl/media/${medium.name}.${medium.extension}`;
          if (medium.filename) {
            const data = await fsReadFileAsync(medium.filename);
            return zip.append(data, { name: filename });
          }
          if (medium.buffer) {
            return zip.append(medium.buffer, { name: filename });
          }
          if (medium.base64) {
            const dataimg64 = medium.base64;
            const content = dataimg64.substring(dataimg64.indexOf(',') + 1);
            return zip.append(content, { name: filename, base64: true });
          }
        }
        throw new Error('Unsupported media');
      })
    );
  }

  addDrawings(zip: ZipWriter, model: WriteModel) {
    const drawingXform = new DrawingXform();
    const relsXform = new RelationshipsXform();

    const worksheets = model.worksheets as ParseWorksheetModel[];
    worksheets.forEach((worksheet) => {
      const drawing = worksheet.drawing as ParseDrawingModel | undefined;
      if (drawing) {
        drawingXform.prepare(drawing);
        let xml = drawingXform.toXml(drawing);
        zip.append(xml, { name: `xl/drawings/${drawing.name}.xml` });

        xml = relsXform.toXml(drawing.rels);
        zip.append(xml, { name: `xl/drawings/_rels/${drawing.name}.xml.rels` });
      }
    });
  }

  addTables(zip: ZipWriter, model: WriteModel) {
    const tableXform = new TableXform();

    const worksheets = model.worksheets as ParseWorksheetModel[];
    worksheets.forEach((worksheet) => {
      const tables = worksheet.tables;
      tables.forEach((table) => {
        tableXform.prepare(table, {});
        const tableXml = tableXform.toXml(table);
        zip.append(tableXml, { name: `xl/tables/${table.target}` });
      });
    });
  }

  addPivotTables(zip: ZipWriter, model: WriteModel) {
    const pivotTables = (model.pivotTables as Record<string, unknown>[] | undefined) || [];
    if (!pivotTables.length) return;

    const pivotTable = pivotTables[0];

    const pivotCacheRecordsXform = new PivotCacheRecordsXform();
    const pivotCacheDefinitionXform = new PivotCacheDefinitionXform();
    const pivotTableXform = new PivotTableXform();
    const relsXform = new RelationshipsXform();

    // pivot cache records
    // --------------------------------------------------
    // copy of the source data.
    //
    // Note: cells in the columns of the source data which are part
    // of the "rows" or "columns" of the pivot table configuration are
    // replaced by references to their __cache field__ identifiers.
    // See "pivot cache definition" below.

    let xml = pivotCacheRecordsXform.toXml(pivotTable);
    zip.append(xml, { name: 'xl/pivotCache/pivotCacheRecords1.xml' });

    // pivot cache definition
    // --------------------------------------------------
    // cache source (source data):
    //    ref="A1:E7" on sheet="Sheet1"
    // cache fields:
    //    - 0: "A" (a1, a2, a3)
    //    - 1: "B" (b1, b2)
    //    - ...

    xml = pivotCacheDefinitionXform.toXml(pivotTable);
    zip.append(xml, { name: 'xl/pivotCache/pivotCacheDefinition1.xml' });

    xml = relsXform.toXml([
      {
        Id: 'rId1',
        Type: XLSX.RelType.PivotCacheRecords,
        Target: 'pivotCacheRecords1.xml',
      },
    ]);
    zip.append(xml, { name: 'xl/pivotCache/_rels/pivotCacheDefinition1.xml.rels' });

    // pivot tables (on destination worksheet)
    // --------------------------------------------------
    // location: ref="A3:E15"
    // pivotFields
    // rowFields and rowItems
    // colFields and colItems
    // dataFields
    // pivotTableStyleInfo

    xml = pivotTableXform.toXml(pivotTable);
    zip.append(xml, { name: 'xl/pivotTables/pivotTable1.xml' });

    xml = relsXform.toXml([
      {
        Id: 'rId1',
        Type: XLSX.RelType.PivotCacheDefinition,
        Target: '../pivotCache/pivotCacheDefinition1.xml',
      },
    ]);
    zip.append(xml, { name: 'xl/pivotTables/_rels/pivotTable1.xml.rels' });
  }

  async addContentTypes(zip: ZipWriter, model: WriteModel) {
    const xform = new ContentTypesXform();
    const xml = xform.toXml(model);
    zip.append(xml, { name: '[Content_Types].xml' });
  }

  async addApp(zip: ZipWriter, model: WriteModel) {
    const xform = new AppXform();
    const xml = xform.toXml(model);
    zip.append(xml, { name: 'docProps/app.xml' });
  }

  async addCore(zip: ZipWriter, model: WriteModel) {
    const coreXform = new CoreXform();
    zip.append(coreXform.toXml(model), { name: 'docProps/core.xml' });
  }

  async addThemes(zip: ZipWriter, model: WriteModel) {
    const themes = (model.themes as Record<string, string> | undefined) || { theme1: theme1Xml };
    Object.keys(themes).forEach((name) => {
      const xml = themes[name];
      const path = `xl/theme/${name}.xml`;
      zip.append(xml, { name: path });
    });
  }

  async addOfficeRels(zip: ZipWriter) {
    const xform = new RelationshipsXform();
    const xml = xform.toXml([
      { Id: 'rId1', Type: XLSX.RelType.OfficeDocument, Target: 'xl/workbook.xml' },
      { Id: 'rId2', Type: XLSX.RelType.CoreProperties, Target: 'docProps/core.xml' },
      { Id: 'rId3', Type: XLSX.RelType.ExtenderProperties, Target: 'docProps/app.xml' },
    ]);
    zip.append(xml, { name: '_rels/.rels' });
  }

  async addWorkbookRels(zip: ZipWriter, model: WriteModel) {
    let count = 1;
    const relationships: RelationshipModel[] = [
      { Id: `rId${count++}`, Type: XLSX.RelType.Styles, Target: 'styles.xml' },
      { Id: `rId${count++}`, Type: XLSX.RelType.Theme, Target: 'theme/theme1.xml' },
    ];
    const sharedStrings = model.sharedStrings as SharedStringsXform;
    if (sharedStrings.count) {
      relationships.push({
        Id: `rId${count++}`,
        Type: XLSX.RelType.SharedStrings,
        Target: 'sharedStrings.xml',
      });
    }
    const pivotTables = (model.pivotTables as Record<string, unknown>[] | undefined) || [];
    if (pivotTables.length) {
      const pivotTable = pivotTables[0];
      pivotTable.rId = `rId${count++}`;
      relationships.push({
        Id: pivotTable.rId as string,
        Type: XLSX.RelType.PivotCacheDefinition,
        Target: 'pivotCache/pivotCacheDefinition1.xml',
      });
    }
    const worksheets = model.worksheets as ParseWorksheetModel[];
    worksheets.forEach((worksheet) => {
      worksheet.rId = `rId${count++}`;
      relationships.push({
        Id: worksheet.rId,
        Type: XLSX.RelType.Worksheet,
        Target: `worksheets/sheet${worksheet.id}.xml`,
      });
    });
    const xform = new RelationshipsXform();
    const xml = xform.toXml(relationships);
    zip.append(xml, { name: 'xl/_rels/workbook.xml.rels' });
  }

  async addSharedStrings(zip: ZipWriter, model: WriteModel) {
    const sharedStrings = model.sharedStrings as SharedStringsXform | undefined;
    if (sharedStrings && sharedStrings.count) {
      zip.append(sharedStrings.xml, { name: 'xl/sharedStrings.xml' });
    }
  }

  async addStyles(zip: ZipWriter, model: WriteModel) {
    const styles = model.styles as StylesXform;
    const { xml } = styles;
    if (xml) {
      zip.append(xml, { name: 'xl/styles.xml' });
    }
  }

  async addWorkbook(zip: ZipWriter, model: WriteModel) {
    const xform = new WorkbookXform();
    zip.append(xform.toXml(model), { name: 'xl/workbook.xml' });
  }

  async addWorksheets(zip: ZipWriter, model: WriteModel) {
    // preparation phase
    const worksheetXform = new WorksheetXform();
    const relationshipsXform = new RelationshipsXform();
    const commentsXform = new CommentsXform();
    const vmlNotesXform = new VmlNotesXform();

    // write sheets
    const worksheets = model.worksheets as ParseWorksheetModel[];
    worksheets.forEach((worksheet) => {
      let xmlStream = new XmlStream();
      worksheetXform.render(xmlStream, worksheet as unknown as WorksheetXformModel);
      zip.append(xmlStream.xml, { name: `xl/worksheets/sheet${worksheet.id}.xml` });

      if (worksheet.rels && worksheet.rels.length) {
        xmlStream = new XmlStream();
        relationshipsXform.render(xmlStream, worksheet.rels);
        zip.append(xmlStream.xml, { name: `xl/worksheets/_rels/sheet${worksheet.id}.xml.rels` });
      }

      if (worksheet.comments.length > 0) {
        xmlStream = new XmlStream();
        commentsXform.render(xmlStream, worksheet);
        zip.append(xmlStream.xml, { name: `xl/comments${worksheet.id}.xml` });

        xmlStream = new XmlStream();
        vmlNotesXform.render(xmlStream, worksheet as unknown as VmlNotesModel);
        zip.append(xmlStream.xml, { name: `xl/drawings/vmlDrawing${worksheet.id}.vml` });
      }
    });
  }

  async _finalize(zip: ZipWriter, stream: NodeJS.WritableStream) {
    const buffer = await zip.generateAsync();
    stream.write(buffer);
    return this;
  }

  prepareModel(model: WriteModel, options: Partial<XlsxWriteOptions>) {
    // ensure following properties have sane values
    model.creator = model.creator || 'ExcelJS';
    model.lastModifiedBy = model.lastModifiedBy || 'ExcelJS';
    model.created = model.created || new Date();
    model.modified = model.modified || new Date();

    model.useSharedStrings =
      options.useSharedStrings !== undefined ? options.useSharedStrings : true;
    model.useStyles = options.useStyles !== undefined ? options.useStyles : true;
    model.media = model.media || [];
    model.definedNames = model.definedNames || [];

    // Manage the shared strings
    const sharedStrings = new SharedStringsXform();
    model.sharedStrings = sharedStrings;

    // add a style manager to handle cell formats, fonts, etc.
    const styles = model.useStyles ? new StylesXform(true) : new StylesXform.Mock();
    model.styles = styles;

    // prepare all of the things before the render
    const workbookXform = new WorkbookXform();
    const worksheetXform = new WorksheetXform();

    workbookXform.prepare(model);

    const properties = model.properties as { date1904?: boolean } | undefined;
    const worksheetOptions: Record<string, unknown> = {
      sharedStrings,
      styles,
      date1904: properties?.date1904,
      drawingsCount: 0,
      media: model.media,
    };
    const drawings: unknown[] = [];
    const commentRefs: unknown[] = [];
    model.drawings = drawings;
    model.commentRefs = commentRefs;
    worksheetOptions.drawings = drawings;
    worksheetOptions.commentRefs = commentRefs;
    let tableCount = 0;
    const tables: ParseTableModel[] = [];
    model.tables = tables;
    const worksheets = model.worksheets as ParseWorksheetModel[];
    worksheets.forEach((worksheet) => {
      // assign unique filenames to tables
      worksheet.tables.forEach((table) => {
        tableCount++;
        table.target = `table${tableCount}.xml`;
        table.id = tableCount;
        tables.push(table);
      });

      worksheetXform.prepare(worksheet as unknown as WorksheetXformModel, worksheetOptions);
    });

    // TODO: workbook drawing list
  }

  async write(stream: NodeJS.WritableStream, options?: Partial<XlsxWriteOptions>) {
    options = options || {};
    // Workbook#model's getter return type has no index signature (see
    // src/core/workbook.ts); the write pipeline below treats it as the
    // dynamically-shaped bag of properties it actually is at runtime.
    const model = this.workbook.model as unknown as WriteModel;
    const zip = new ZipWriter(options.zip);

    this.prepareModel(model, options);

    // render
    await this.addContentTypes(zip, model);
    await this.addOfficeRels(zip);
    await this.addWorkbookRels(zip, model);
    await this.addWorksheets(zip, model);
    await this.addSharedStrings(zip, model); // always after worksheets
    await this.addDrawings(zip, model);
    await this.addTables(zip, model);
    await this.addPivotTables(zip, model);
    await Promise.all([this.addThemes(zip, model), this.addStyles(zip, model)]);
    await this.addMedia(zip, model);
    await Promise.all([this.addApp(zip, model), this.addCore(zip, model)]);
    await this.addWorkbook(zip, model);
    return this._finalize(zip, stream);
  }

  writeFile(filename: string, options?: Partial<XlsxWriteOptions>) {
    const stream = fs.createWriteStream(filename);

    return new Promise<void>((resolve, reject) => {
      stream.on('finish', () => {
        resolve(undefined);
      });
      stream.on('error', (error) => {
        reject(error);
      });

      this.write(stream, options)
        .then(() => {
          stream.end();
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async writeBuffer(options?: Partial<XlsxWriteOptions>) {
    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    await this.write(stream, options);
    return Buffer.concat(chunks);
  }
}

XLSX.RelType = RelType;

export type Xlsx = XLSX;

export default XLSX;
