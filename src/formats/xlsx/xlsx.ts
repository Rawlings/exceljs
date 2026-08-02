import fs from 'fs';
import { ZipReader as JSZip, ZipWriter } from '#src/utils/stream/zip';
import { PassThrough } from 'stream';

import XmlStream from '#src/utils/stream/xml-stream';

import StylesXform from '#src/formats/xlsx/xml/style/styles-xform';

import CoreXform from '#src/formats/xlsx/xml/core/core-xform';
import SharedStringsXform from '#src/formats/xlsx/xml/strings/shared-strings-xform';
import RelationshipsXform from '#src/formats/xlsx/xml/core/relationships-xform';
import ContentTypesXform from '#src/formats/xlsx/xml/core/content-types-xform';
import AppXform from '#src/formats/xlsx/xml/core/app-xform';
import WorkbookXform from '#src/formats/xlsx/xml/book/workbook-xform';
import WorksheetXform from '#src/formats/xlsx/xml/sheet/worksheet-xform';
import DrawingXform from '#src/formats/xlsx/xml/drawing/drawing-xform';
import TableXform from '#src/formats/xlsx/xml/table/table-xform';
import PivotCacheRecordsXform from '#src/formats/xlsx/xml/pivot-table/pivot-cache-records-xform';
import PivotCacheDefinitionXform from '#src/formats/xlsx/xml/pivot-table/pivot-cache-definition-xform';
import PivotTableXform from '#src/formats/xlsx/xml/pivot-table/pivot-table-xform';
import CommentsXform from '#src/formats/xlsx/xml/comment/comments-xform';
import VmlNotesXform from '#src/formats/xlsx/xml/comment/vml-notes-xform';
import RelType from '#src/formats/xlsx/rel-type';

// @ts-ignore
import theme1Xml from '#src/formats/xlsx/theme1';

function fsReadFileAsync(filename: any, options?: any) {
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

class XLSX {
  workbook: any;
  static RelType: any;

  constructor(workbook?: any) {
    this.workbook = workbook;
  }

  // ===============================================================================
  // Workbook
  // =========================================================================
  // Read

  async readFile(filename: any, options?: any) {
    if (!fs.existsSync(filename)) {
      throw new Error(`File not found: ${filename}`);
    }
    const stream = fs.createReadStream(filename);
    try {
      const workbook = await this.read(stream, options);
      stream.close();
      return workbook;
    } catch (error: any) {
      stream.close();
      throw error;
    }
  }

  parseRels(stream: any) {
    const xform = new RelationshipsXform();
    return xform.parseStream(stream);
  }

  parseWorkbook(stream: any) {
    const xform = new WorkbookXform();
    return xform.parseStream(stream);
  }

  parseSharedStrings(stream: any) {
    const xform = new SharedStringsXform();
    return xform.parseStream(stream);
  }

  reconcile(model: any, options: any) {
    const workbookXform = new WorkbookXform();
    const worksheetXform = new WorksheetXform(options);
    const drawingXform = new DrawingXform();
    const tableXform = new TableXform();

    workbookXform.reconcile(model);

    // reconcile drawings with their rels
    const drawingOptions: any = {
      media: model.media,
      mediaIndex: model.mediaIndex,
    };
    Object.keys(model.drawings).forEach((name) => {
      const drawing = model.drawings[name];
      const drawingRel = model.drawingRels[name];
      if (drawingRel) {
        drawingOptions.rels = drawingRel.reduce((o: any, rel: any) => {
          o[rel.Id] = rel;
          return o;
        }, {});
        (drawing.anchors || []).forEach((anchor: any) => {
          const hyperlinks = anchor.picture && anchor.picture.hyperlinks;
          if (hyperlinks && drawingOptions.rels[hyperlinks.rId]) {
            hyperlinks.hyperlink = drawingOptions.rels[hyperlinks.rId].Target;
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
    model.worksheets.forEach((worksheet: any) => {
      worksheet.relationships = model.worksheetRels[worksheet.sheetNo];
      worksheetXform.reconcile(worksheet, sheetOptions);
    });

    // delete unnecessary parts
    delete model.worksheetHash;
    delete model.worksheetRels;
    delete model.globalRels;
    delete model.sharedStrings;
    delete model.workbookRels;
    delete model.sheetDefs;
    delete model.styles;
    delete model.mediaIndex;
    delete model.drawings;
    delete model.drawingRels;
    delete model.vmlDrawings;
  }

  async _processWorksheetEntry(stream: any, model: any, sheetNo: any, options: any, path: any) {
    const xform = new WorksheetXform(options);
    const worksheet = await xform.parseStream(stream);
    if (worksheet) {
      worksheet.sheetNo = /^\d+$/.test(sheetNo) ? parseInt(sheetNo, 10) : sheetNo;
      model.worksheetHash[path] = worksheet;
      model.worksheets.push(worksheet);
    }
  }

  async _processCommentEntry(stream: any, model: any, name: any) {
    const xform = new CommentsXform();
    const comments = await xform.parseStream(stream);
    model.comments[`../${name}.xml`] = comments;
  }

  async _processTableEntry(stream: any, model: any, name: any) {
    const xform = new TableXform();
    const table = await xform.parseStream(stream);
    model.tables[`../tables/${name}.xml`] = table;
  }

  async _processWorksheetRelsEntry(stream: any, model: any, sheetNo: any) {
    const xform = new RelationshipsXform();
    const relationships = await xform.parseStream(stream);
    const key = /^\d+$/.test(sheetNo) ? parseInt(sheetNo, 10) : sheetNo;
    model.worksheetRels[key] = relationships;
  }

  async _processMediaEntry(entry: any, model: any, filename: any) {
    const lastDot = filename.lastIndexOf('.');
    // if we can't determine extension, ignore it
    if (lastDot >= 1) {
      const extension = filename.substr(lastDot + 1);
      const name = filename.substr(0, lastDot);
      let buffer: Buffer;
      if (typeof entry.read === 'function') {
        const chunks: Buffer[] = [];
        let chunk: any;
        while ((chunk = entry.read()) !== null) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      } else {
        buffer = await entry.async('nodebuffer');
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

  async _processDrawingEntry(entry: any, model: any, name: any) {
    const xform = new DrawingXform();
    const drawing = await xform.parseStream(entry);
    model.drawings[name] = drawing;
  }

  async _processDrawingRelsEntry(entry: any, model: any, name: any) {
    const xform = new RelationshipsXform();
    const relationships = await xform.parseStream(entry);
    model.drawingRels[name] = relationships;
  }

  async _processVmlDrawingEntry(entry: any, model: any, name: any) {
    const xform = new VmlNotesXform();
    const vmlDrawing = await xform.parseStream(entry);
    model.vmlDrawings[`../drawings/${name}.vml`] = vmlDrawing;
  }

  async _processThemeEntry(entry: any, model: any, name: any) {
    const buffer =
      typeof entry.read === 'function' ? entry.read() : await entry.async('nodebuffer');
    model.themes[name] = buffer ? buffer.toString() : '';
  }

  /**
   * @deprecated since version 4.0. You should use `#read` instead. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md
   */
  createInputStream() {
    throw new Error(
      '`XLSX#createInputStream` is deprecated. You should use `XLSX#read` instead. This method will be removed in version 5.0. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md'
    );
  }

  async read(stream: any, options?: any) {
    // TODO: Remove once node v8 is deprecated
    // Detect and upgrade old streams
    if (!stream[Symbol.asyncIterator] && stream.pipe) {
      stream = stream.pipe(new PassThrough());
    }
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return this.load(Buffer.concat(chunks), options);
  }

  async load(data: any, options?: any) {
    let buffer;
    if (options && options.base64) {
      buffer = Buffer.from(data.toString(), 'base64');
    } else {
      buffer = data;
    }

    const model: any = {
      worksheets: [],
      worksheetHash: {},
      worksheetRels: [],
      themes: {},
      media: [],
      mediaIndex: {},
      drawings: {},
      drawingRels: {},
      comments: {},
      tables: {},
      vmlDrawings: {},
    };

    const zip = await JSZip.loadAsync(buffer);
    const entries = (Object.values(zip.files) as any[]).sort((a, b) => {
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
        let stream;
        if (
          entryName.match(/xl\/media\//) ||
          // themes are not parsed as stream
          entryName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/)
        ) {
          stream = new PassThrough();
          stream.end(await entry.async('nodebuffer'));
        } else {
          stream = await entry.async('string');
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
              await this._processThemeEntry(stream, model, match[1]);
              break;
            }
            match = keyName.match(/xl\/media\/([^/]+)$/);
            if (match) {
              await this._processMediaEntry(stream, model, match[1]);
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
    this.workbook.model = model;
    return this.workbook;
  }

  // =========================================================================
  // Write

  async addMedia(zip: any, model: any) {
    await Promise.all(
      model.media.map(async (medium: any) => {
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

  addDrawings(zip: any, model: any) {
    const drawingXform = new DrawingXform();
    const relsXform = new RelationshipsXform();

    model.worksheets.forEach((worksheet: any) => {
      const { drawing } = worksheet;
      if (drawing) {
        drawingXform.prepare(drawing);
        let xml = drawingXform.toXml(drawing);
        zip.append(xml, { name: `xl/drawings/${drawing.name}.xml` });

        xml = relsXform.toXml(drawing.rels);
        zip.append(xml, { name: `xl/drawings/_rels/${drawing.name}.xml.rels` });
      }
    });
  }

  addTables(zip: any, model: any) {
    const tableXform = new TableXform();

    model.worksheets.forEach((worksheet: any) => {
      const { tables } = worksheet;
      tables.forEach((table: any) => {
        tableXform.prepare(table, {});
        const tableXml = tableXform.toXml(table);
        zip.append(tableXml, { name: `xl/tables/${table.target}` });
      });
    });
  }

  addPivotTables(zip: any, model: any) {
    if (!model.pivotTables.length) return;

    const pivotTable = model.pivotTables[0];

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

  async addContentTypes(zip: any, model: any) {
    const xform = new ContentTypesXform();
    const xml = xform.toXml(model);
    zip.append(xml, { name: '[Content_Types].xml' });
  }

  async addApp(zip: any, model: any) {
    const xform = new AppXform();
    const xml = xform.toXml(model);
    zip.append(xml, { name: 'docProps/app.xml' });
  }

  async addCore(zip: any, model: any) {
    const coreXform = new CoreXform();
    zip.append(coreXform.toXml(model), { name: 'docProps/core.xml' });
  }

  async addThemes(zip: any, model: any) {
    const themes = model.themes || { theme1: theme1Xml };
    Object.keys(themes).forEach((name) => {
      const xml = themes[name];
      const path = `xl/theme/${name}.xml`;
      zip.append(xml, { name: path });
    });
  }

  async addOfficeRels(zip: any) {
    const xform = new RelationshipsXform();
    const xml = xform.toXml([
      { Id: 'rId1', Type: XLSX.RelType.OfficeDocument, Target: 'xl/workbook.xml' },
      { Id: 'rId2', Type: XLSX.RelType.CoreProperties, Target: 'docProps/core.xml' },
      { Id: 'rId3', Type: XLSX.RelType.ExtenderProperties, Target: 'docProps/app.xml' },
    ]);
    zip.append(xml, { name: '_rels/.rels' });
  }

  async addWorkbookRels(zip: any, model: any) {
    let count = 1;
    const relationships = [
      { Id: `rId${count++}`, Type: XLSX.RelType.Styles, Target: 'styles.xml' },
      { Id: `rId${count++}`, Type: XLSX.RelType.Theme, Target: 'theme/theme1.xml' },
    ];
    if (model.sharedStrings.count) {
      relationships.push({
        Id: `rId${count++}`,
        Type: XLSX.RelType.SharedStrings,
        Target: 'sharedStrings.xml',
      });
    }
    if ((model.pivotTables || []).length) {
      const pivotTable = model.pivotTables[0];
      pivotTable.rId = `rId${count++}`;
      relationships.push({
        Id: pivotTable.rId,
        Type: XLSX.RelType.PivotCacheDefinition,
        Target: 'pivotCache/pivotCacheDefinition1.xml',
      });
    }
    model.worksheets.forEach((worksheet: any) => {
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

  async addSharedStrings(zip: any, model: any) {
    if (model.sharedStrings && model.sharedStrings.count) {
      zip.append(model.sharedStrings.xml, { name: 'xl/sharedStrings.xml' });
    }
  }

  async addStyles(zip: any, model: any) {
    const { xml } = model.styles;
    if (xml) {
      zip.append(xml, { name: 'xl/styles.xml' });
    }
  }

  async addWorkbook(zip: any, model: any) {
    const xform = new WorkbookXform();
    zip.append(xform.toXml(model), { name: 'xl/workbook.xml' });
  }

  async addWorksheets(zip: any, model: any) {
    // preparation phase
    const worksheetXform = new WorksheetXform();
    const relationshipsXform = new RelationshipsXform();
    const commentsXform = new CommentsXform();
    const vmlNotesXform = new VmlNotesXform();

    // write sheets
    model.worksheets.forEach((worksheet: any) => {
      let xmlStream = new XmlStream();
      worksheetXform.render(xmlStream, worksheet);
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
        vmlNotesXform.render(xmlStream, worksheet);
        zip.append(xmlStream.xml, { name: `xl/drawings/vmlDrawing${worksheet.id}.vml` });
      }
    });
  }

  async _finalize(zip: any, stream: any) {
    const buffer = await zip.generateAsync();
    stream.write(buffer);
    return this;
  }

  prepareModel(model: any, options: any) {
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
    model.sharedStrings = new SharedStringsXform();

    // add a style manager to handle cell formats, fonts, etc.
    model.styles = model.useStyles
      ? new StylesXform(true)
      : new (StylesXform.Mock as new (...args: any[]) => any)();

    // prepare all of the things before the render
    const workbookXform = new WorkbookXform();
    const worksheetXform = new WorksheetXform();

    workbookXform.prepare(model);

    const worksheetOptions: any = {
      sharedStrings: model.sharedStrings,
      styles: model.styles,
      date1904: model.properties.date1904,
      drawingsCount: 0,
      media: model.media,
    };
    worksheetOptions.drawings = model.drawings = [];
    worksheetOptions.commentRefs = model.commentRefs = [];
    let tableCount = 0;
    model.tables = [];
    model.worksheets.forEach((worksheet: any) => {
      // assign unique filenames to tables
      worksheet.tables.forEach((table: any) => {
        tableCount++;
        table.target = `table${tableCount}.xml`;
        table.id = tableCount;
        model.tables.push(table);
      });

      worksheetXform.prepare(worksheet, worksheetOptions);
    });

    // TODO: workbook drawing list
  }

  async write(stream: any, options?: any) {
    options = options || {};
    const { model } = this.workbook;
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

  writeFile(filename: any, options?: any) {
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

  async writeBuffer(options?: any) {
    const chunks: Buffer[] = [];
    const stream = new PassThrough();
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    await this.write(stream, options);
    return Buffer.concat(chunks);
  }
}

(XLSX as any).RelType = RelType;

export default XLSX;
