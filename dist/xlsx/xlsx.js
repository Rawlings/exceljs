"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const native_zip_1 = require("../utils/native-zip");
const stream_1 = require("stream");
const zip_stream_1 = __importDefault(require("../utils/zip-stream"));
const stream_buf_1 = __importDefault(require("../utils/stream-buf"));
const xml_stream_1 = __importDefault(require("../utils/xml-stream"));
const styles_xform_1 = __importDefault(require("./xform/style/styles-xform"));
const core_xform_1 = __importDefault(require("./xform/core/core-xform"));
const shared_strings_xform_1 = __importDefault(require("./xform/strings/shared-strings-xform"));
const relationships_xform_1 = __importDefault(require("./xform/core/relationships-xform"));
const content_types_xform_1 = __importDefault(require("./xform/core/content-types-xform"));
const app_xform_1 = __importDefault(require("./xform/core/app-xform"));
const workbook_xform_1 = __importDefault(require("./xform/book/workbook-xform"));
const worksheet_xform_1 = __importDefault(require("./xform/sheet/worksheet-xform"));
const drawing_xform_1 = __importDefault(require("./xform/drawing/drawing-xform"));
const table_xform_1 = __importDefault(require("./xform/table/table-xform"));
const pivot_cache_records_xform_1 = __importDefault(require("./xform/pivot-table/pivot-cache-records-xform"));
const pivot_cache_definition_xform_1 = __importDefault(require("./xform/pivot-table/pivot-cache-definition-xform"));
const pivot_table_xform_1 = __importDefault(require("./xform/pivot-table/pivot-table-xform"));
const comments_xform_1 = __importDefault(require("./xform/comment/comments-xform"));
const vml_notes_xform_1 = __importDefault(require("./xform/comment/vml-notes-xform"));
const rel_type_1 = __importDefault(require("./rel-type"));
const theme1_1 = __importDefault(require("./theme1"));
function fsReadFileAsync(filename, options) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(filename, options, (error, data) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(data);
            }
        });
    });
}
class XLSX {
    workbook;
    static RelType;
    constructor(workbook) {
        this.workbook = workbook;
    }
    // ===============================================================================
    // Workbook
    // =========================================================================
    // Read
    async readFile(filename, options) {
        if (!(await utils.fs.exists(filename))) {
            throw new Error(`File not found: ${filename}`);
        }
        const stream = fs_1.default.createReadStream(filename);
        try {
            const workbook = await this.read(stream, options);
            stream.close();
            return workbook;
        }
        catch (error) {
            stream.close();
            throw error;
        }
    }
    parseRels(stream) {
        const xform = new relationships_xform_1.default();
        return xform.parseStream(stream);
    }
    parseWorkbook(stream) {
        const xform = new workbook_xform_1.default();
        return xform.parseStream(stream);
    }
    parseSharedStrings(stream) {
        const xform = new shared_strings_xform_1.default();
        return xform.parseStream(stream);
    }
    reconcile(model, options) {
        const workbookXform = new workbook_xform_1.default();
        const worksheetXform = new worksheet_xform_1.default(options);
        const drawingXform = new drawing_xform_1.default();
        const tableXform = new table_xform_1.default();
        workbookXform.reconcile(model);
        // reconcile drawings with their rels
        const drawingOptions = {
            media: model.media,
            mediaIndex: model.mediaIndex,
        };
        Object.keys(model.drawings).forEach((name) => {
            const drawing = model.drawings[name];
            const drawingRel = model.drawingRels[name];
            if (drawingRel) {
                drawingOptions.rels = drawingRel.reduce((o, rel) => {
                    o[rel.Id] = rel;
                    return o;
                }, {});
                (drawing.anchors || []).forEach((anchor) => {
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
        model.worksheets.forEach((worksheet) => {
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
    async _processWorksheetEntry(stream, model, sheetNo, options, path) {
        const xform = new worksheet_xform_1.default(options);
        const worksheet = await xform.parseStream(stream);
        worksheet.sheetNo = sheetNo;
        model.worksheetHash[path] = worksheet;
        model.worksheets.push(worksheet);
    }
    async _processCommentEntry(stream, model, name) {
        const xform = new comments_xform_1.default();
        const comments = await xform.parseStream(stream);
        model.comments[`../${name}.xml`] = comments;
    }
    async _processTableEntry(stream, model, name) {
        const xform = new table_xform_1.default();
        const table = await xform.parseStream(stream);
        model.tables[`../tables/${name}.xml`] = table;
    }
    async _processWorksheetRelsEntry(stream, model, sheetNo) {
        const xform = new relationships_xform_1.default();
        const relationships = await xform.parseStream(stream);
        model.worksheetRels[sheetNo] = relationships;
    }
    async _processMediaEntry(entry, model, filename) {
        const lastDot = filename.lastIndexOf('.');
        // if we can't determine extension, ignore it
        if (lastDot >= 1) {
            const extension = filename.substr(lastDot + 1);
            const name = filename.substr(0, lastDot);
            await new Promise((resolve, reject) => {
                const streamBuf = new stream_buf_1.default();
                streamBuf.on('finish', () => {
                    model.mediaIndex[filename] = model.media.length;
                    model.mediaIndex[name] = model.media.length;
                    const medium = {
                        type: 'image',
                        name,
                        extension,
                        buffer: streamBuf.toBuffer(),
                    };
                    model.media.push(medium);
                    resolve();
                });
                entry.on('error', (error) => {
                    reject(error);
                });
                entry.pipe(streamBuf);
            });
        }
    }
    async _processDrawingEntry(entry, model, name) {
        const xform = new drawing_xform_1.default();
        const drawing = await xform.parseStream(entry);
        model.drawings[name] = drawing;
    }
    async _processDrawingRelsEntry(entry, model, name) {
        const xform = new relationships_xform_1.default();
        const relationships = await xform.parseStream(entry);
        model.drawingRels[name] = relationships;
    }
    async _processVmlDrawingEntry(entry, model, name) {
        const xform = new vml_notes_xform_1.default();
        const vmlDrawing = await xform.parseStream(entry);
        model.vmlDrawings[`../drawings/${name}.vml`] = vmlDrawing;
    }
    async _processThemeEntry(entry, model, name) {
        await new Promise((resolve, reject) => {
            // TODO: stream entry into buffer and store the xml in the model.themes[]
            const stream = new stream_buf_1.default();
            entry.on('error', reject);
            stream.on('error', reject);
            stream.on('finish', () => {
                model.themes[name] = stream.read().toString();
                resolve();
            });
            entry.pipe(stream);
        });
    }
    /**
     * @deprecated since version 4.0. You should use `#read` instead. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md
     */
    createInputStream() {
        throw new Error('`XLSX#createInputStream` is deprecated. You should use `XLSX#read` instead. This method will be removed in version 5.0. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md');
    }
    async read(stream, options) {
        // TODO: Remove once node v8 is deprecated
        // Detect and upgrade old streams
        if (!stream[Symbol.asyncIterator] && stream.pipe) {
            stream = stream.pipe(new stream_1.PassThrough());
        }
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return this.load(Buffer.concat(chunks), options);
    }
    async load(data, options) {
        let buffer;
        if (options && options.base64) {
            buffer = Buffer.from(data.toString(), 'base64');
        }
        else {
            buffer = data;
        }
        const model = {
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
        const zip = await native_zip_1.NativeZipReader.loadAsync(buffer);
        for (const entry of Object.values(zip.files)) {
            /* eslint-disable no-await-in-loop */
            if (!entry.dir) {
                let entryName = entry.name;
                if (entryName[0] === '/') {
                    entryName = entryName.substr(1);
                }
                let stream;
                if (entryName.match(/xl\/media\//) ||
                    // themes are not parsed as stream
                    entryName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/)) {
                    stream = new stream_1.PassThrough();
                    stream.write(await entry.async('nodebuffer'));
                }
                else {
                    // use object mode to avoid buffer-string convention
                    stream = new stream_1.PassThrough({
                        writableObjectMode: true,
                        readableObjectMode: true,
                    });
                    const content = await entry.async('string');
                    const chunkSize = 16 * 1024;
                    for (let i = 0; i < content.length; i += chunkSize) {
                        stream.write(content.substring(i, i + chunkSize));
                    }
                }
                stream.end();
                switch (entryName) {
                    case '_rels/.rels':
                        model.globalRels = await this.parseRels(stream);
                        break;
                    case 'xl/workbook.xml': {
                        const workbook = await this.parseWorkbook(stream);
                        model.sheets = workbook.sheets;
                        model.definedNames = workbook.definedNames;
                        model.views = workbook.views;
                        model.properties = workbook.properties;
                        model.calcProperties = workbook.calcProperties;
                        break;
                    }
                    case 'xl/_rels/workbook.xml.rels':
                        model.workbookRels = await this.parseRels(stream);
                        break;
                    case 'xl/sharedStrings.xml':
                        model.sharedStrings = new shared_strings_xform_1.default();
                        await model.sharedStrings.parseStream(stream);
                        break;
                    case 'xl/styles.xml':
                        model.styles = new styles_xform_1.default();
                        await model.styles.parseStream(stream);
                        break;
                    case 'docProps/app.xml': {
                        const appXform = new app_xform_1.default();
                        const appProperties = await appXform.parseStream(stream);
                        model.company = appProperties.company;
                        model.manager = appProperties.manager;
                        break;
                    }
                    case 'docProps/core.xml': {
                        const coreXform = new core_xform_1.default();
                        const coreProperties = await coreXform.parseStream(stream);
                        Object.assign(model, coreProperties);
                        break;
                    }
                    default: {
                        let match = entryName.match(/xl\/worksheets\/sheet(\d+)[.]xml/);
                        if (match) {
                            await this._processWorksheetEntry(stream, model, match[1], options, entryName);
                            break;
                        }
                        match = entryName.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml.rels/);
                        if (match) {
                            await this._processWorksheetRelsEntry(stream, model, match[1]);
                            break;
                        }
                        match = entryName.match(/xl\/theme\/([a-zA-Z0-9]+)[.]xml/);
                        if (match) {
                            await this._processThemeEntry(stream, model, match[1]);
                            break;
                        }
                        match = entryName.match(/xl\/media\/([a-zA-Z0-9]+[.][a-zA-Z0-9]{3,4})$/);
                        if (match) {
                            await this._processMediaEntry(stream, model, match[1]);
                            break;
                        }
                        match = entryName.match(/xl\/drawings\/([a-zA-Z0-9]+)[.]xml/);
                        if (match) {
                            await this._processDrawingEntry(stream, model, match[1]);
                            break;
                        }
                        match = entryName.match(/xl\/(comments\d+)[.]xml/);
                        if (match) {
                            await this._processCommentEntry(stream, model, match[1]);
                            break;
                        }
                        match = entryName.match(/xl\/tables\/(table\d+)[.]xml/);
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
    async addMedia(zip, model) {
        await Promise.all(model.media.map(async (medium) => {
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
        }));
    }
    addDrawings(zip, model) {
        const drawingXform = new drawing_xform_1.default();
        const relsXform = new relationships_xform_1.default();
        model.worksheets.forEach((worksheet) => {
            const { drawing } = worksheet;
            if (drawing) {
                drawingXform.prepare(drawing, {});
                let xml = drawingXform.toXml(drawing);
                zip.append(xml, { name: `xl/drawings/${drawing.name}.xml` });
                xml = relsXform.toXml(drawing.rels);
                zip.append(xml, { name: `xl/drawings/_rels/${drawing.name}.xml.rels` });
            }
        });
    }
    addTables(zip, model) {
        const tableXform = new table_xform_1.default();
        model.worksheets.forEach((worksheet) => {
            const { tables } = worksheet;
            tables.forEach((table) => {
                tableXform.prepare(table, {});
                const tableXml = tableXform.toXml(table);
                zip.append(tableXml, { name: `xl/tables/${table.target}` });
            });
        });
    }
    addPivotTables(zip, model) {
        if (!model.pivotTables.length)
            return;
        const pivotTable = model.pivotTables[0];
        const pivotCacheRecordsXform = new pivot_cache_records_xform_1.default();
        const pivotCacheDefinitionXform = new pivot_cache_definition_xform_1.default();
        const pivotTableXform = new pivot_table_xform_1.default();
        const relsXform = new relationships_xform_1.default();
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
    async addContentTypes(zip, model) {
        const xform = new content_types_xform_1.default();
        const xml = xform.toXml(model);
        zip.append(xml, { name: '[Content_Types].xml' });
    }
    async addApp(zip, model) {
        const xform = new app_xform_1.default();
        const xml = xform.toXml(model);
        zip.append(xml, { name: 'docProps/app.xml' });
    }
    async addCore(zip, model) {
        const coreXform = new core_xform_1.default();
        zip.append(coreXform.toXml(model), { name: 'docProps/core.xml' });
    }
    async addThemes(zip, model) {
        const themes = model.themes || { theme1: theme1_1.default };
        Object.keys(themes).forEach((name) => {
            const xml = themes[name];
            const path = `xl/theme/${name}.xml`;
            zip.append(xml, { name: path });
        });
    }
    async addOfficeRels(zip) {
        const xform = new relationships_xform_1.default();
        const xml = xform.toXml([
            { Id: 'rId1', Type: XLSX.RelType.OfficeDocument, Target: 'xl/workbook.xml' },
            { Id: 'rId2', Type: XLSX.RelType.CoreProperties, Target: 'docProps/core.xml' },
            { Id: 'rId3', Type: XLSX.RelType.ExtenderProperties, Target: 'docProps/app.xml' },
        ]);
        zip.append(xml, { name: '_rels/.rels' });
    }
    async addWorkbookRels(zip, model) {
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
        model.worksheets.forEach((worksheet) => {
            worksheet.rId = `rId${count++}`;
            relationships.push({
                Id: worksheet.rId,
                Type: XLSX.RelType.Worksheet,
                Target: `worksheets/sheet${worksheet.id}.xml`,
            });
        });
        const xform = new relationships_xform_1.default();
        const xml = xform.toXml(relationships);
        zip.append(xml, { name: 'xl/_rels/workbook.xml.rels' });
    }
    async addSharedStrings(zip, model) {
        if (model.sharedStrings && model.sharedStrings.count) {
            zip.append(model.sharedStrings.xml, { name: 'xl/sharedStrings.xml' });
        }
    }
    async addStyles(zip, model) {
        const { xml } = model.styles;
        if (xml) {
            zip.append(xml, { name: 'xl/styles.xml' });
        }
    }
    async addWorkbook(zip, model) {
        const xform = new workbook_xform_1.default();
        zip.append(xform.toXml(model), { name: 'xl/workbook.xml' });
    }
    async addWorksheets(zip, model) {
        // preparation phase
        const worksheetXform = new worksheet_xform_1.default();
        const relationshipsXform = new relationships_xform_1.default();
        const commentsXform = new comments_xform_1.default();
        const vmlNotesXform = new vml_notes_xform_1.default();
        // write sheets
        model.worksheets.forEach((worksheet) => {
            let xmlStream = new xml_stream_1.default();
            worksheetXform.render(xmlStream, worksheet);
            zip.append(xmlStream.xml, { name: `xl/worksheets/sheet${worksheet.id}.xml` });
            if (worksheet.rels && worksheet.rels.length) {
                xmlStream = new xml_stream_1.default();
                relationshipsXform.render(xmlStream, worksheet.rels);
                zip.append(xmlStream.xml, { name: `xl/worksheets/_rels/sheet${worksheet.id}.xml.rels` });
            }
            if (worksheet.comments.length > 0) {
                xmlStream = new xml_stream_1.default();
                commentsXform.render(xmlStream, worksheet);
                zip.append(xmlStream.xml, { name: `xl/comments${worksheet.id}.xml` });
                xmlStream = new xml_stream_1.default();
                vmlNotesXform.render(xmlStream, worksheet);
                zip.append(xmlStream.xml, { name: `xl/drawings/vmlDrawing${worksheet.id}.vml` });
            }
        });
    }
    _finalize(zip) {
        return new Promise((resolve, reject) => {
            zip.on('finish', () => {
                resolve(this);
            });
            zip.on('error', reject);
            zip.finalize();
        });
    }
    prepareModel(model, options) {
        // ensure following properties have sane values
        model.creator = model.creator || 'ExcelJS';
        model.lastModifiedBy = model.lastModifiedBy || 'ExcelJS';
        model.created = model.created || new Date();
        model.modified = model.modified || new Date();
        model.useSharedStrings =
            options.useSharedStrings !== undefined ? options.useSharedStrings : true;
        model.useStyles = options.useStyles !== undefined ? options.useStyles : true;
        // Manage the shared strings
        model.sharedStrings = new shared_strings_xform_1.default();
        // add a style manager to handle cell formats, fonts, etc.
        model.styles = model.useStyles ? new styles_xform_1.default(true) : new styles_xform_1.default.Mock();
        // prepare all of the things before the render
        const workbookXform = new workbook_xform_1.default();
        const worksheetXform = new worksheet_xform_1.default();
        workbookXform.prepare(model);
        const worksheetOptions = {
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
        model.worksheets.forEach((worksheet) => {
            // assign unique filenames to tables
            worksheet.tables.forEach((table) => {
                tableCount++;
                table.target = `table${tableCount}.xml`;
                table.id = tableCount;
                model.tables.push(table);
            });
            worksheetXform.prepare(worksheet, worksheetOptions);
        });
        // TODO: workbook drawing list
    }
    async write(stream, options) {
        options = options || {};
        const { model } = this.workbook;
        const zip = new zip_stream_1.default.ZipWriter(options.zip);
        zip.pipe(stream);
        this.prepareModel(model, options);
        // render
        await this.addContentTypes(zip, model);
        await this.addOfficeRels(zip, model);
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
        return this._finalize(zip);
    }
    writeFile(filename, options) {
        const stream = fs_1.default.createWriteStream(filename);
        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve();
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
    async writeBuffer(options) {
        const stream = new stream_buf_1.default();
        await this.write(stream, options);
        return stream.read();
    }
}
XLSX.RelType = rel_type_1.default;
exports.default = XLSX;
