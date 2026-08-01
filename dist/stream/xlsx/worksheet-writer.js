"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../utils/under-dash"));
const rel_type_1 = __importDefault(require("../../xlsx/rel-type"));
const col_cache_1 = __importDefault(require("../../utils/col-cache"));
const encryptor_1 = __importDefault(require("../../utils/encryptor"));
const range_1 = __importDefault(require("../../doc/range"));
const string_buf_1 = __importDefault(require("../../utils/string-buf"));
const row_1 = __importDefault(require("../../doc/row"));
const column_1 = __importDefault(require("../../doc/column"));
const sheet_rels_writer_1 = __importDefault(require("./sheet-rels-writer"));
const sheet_comments_writer_1 = __importDefault(require("./sheet-comments-writer"));
const data_validations_1 = __importDefault(require("../../doc/data-validations"));
const xmlBuffer = new string_buf_1.default();
// ============================================================================================
// Xforms
const list_xform_1 = __importDefault(require("../../xlsx/xform/list-xform"));
const data_validations_xform_1 = __importDefault(require("../../xlsx/xform/sheet/data-validations-xform"));
const sheet_properties_xform_1 = __importDefault(require("../../xlsx/xform/sheet/sheet-properties-xform"));
const sheet_format_properties_xform_1 = __importDefault(require("../../xlsx/xform/sheet/sheet-format-properties-xform"));
const col_xform_1 = __importDefault(require("../../xlsx/xform/sheet/col-xform"));
const row_xform_1 = __importDefault(require("../../xlsx/xform/sheet/row-xform"));
const hyperlink_xform_1 = __importDefault(require("../../xlsx/xform/sheet/hyperlink-xform"));
const sheet_view_xform_1 = __importDefault(require("../../xlsx/xform/sheet/sheet-view-xform"));
const sheet_protection_xform_1 = __importDefault(require("../../xlsx/xform/sheet/sheet-protection-xform"));
const page_margins_xform_1 = __importDefault(require("../../xlsx/xform/sheet/page-margins-xform"));
const page_setup_xform_1 = __importDefault(require("../../xlsx/xform/sheet/page-setup-xform"));
const auto_filter_xform_1 = __importDefault(require("../../xlsx/xform/sheet/auto-filter-xform"));
const picture_xform_1 = __importDefault(require("../../xlsx/xform/sheet/picture-xform"));
const conditional_formattings_xform_1 = __importDefault(require("../../xlsx/xform/sheet/cf/conditional-formattings-xform"));
const header_footer_xform_1 = __importDefault(require("../../xlsx/xform/sheet/header-footer-xform"));
const row_breaks_xform_1 = __importDefault(require("../../xlsx/xform/sheet/row-breaks-xform"));
// since prepare and render are functional, we can use singletons
const xform = {
    dataValidations: new data_validations_xform_1.default(),
    sheetProperties: new sheet_properties_xform_1.default(),
    sheetFormatProperties: new sheet_format_properties_xform_1.default(),
    columns: new list_xform_1.default({ tag: 'cols', length: false, childXform: new col_xform_1.default() }),
    row: new row_xform_1.default(),
    hyperlinks: new list_xform_1.default({ tag: 'hyperlinks', length: false, childXform: new hyperlink_xform_1.default() }),
    sheetViews: new list_xform_1.default({ tag: 'sheetViews', length: false, childXform: new sheet_view_xform_1.default() }),
    sheetProtection: new sheet_protection_xform_1.default(),
    pageMargins: new page_margins_xform_1.default(),
    pageSeteup: new page_setup_xform_1.default(),
    autoFilter: new auto_filter_xform_1.default(),
    picture: new picture_xform_1.default(),
    conditionalFormattings: new conditional_formattings_xform_1.default(),
    headerFooter: new header_footer_xform_1.default(),
    rowBreaks: new row_breaks_xform_1.default(),
};
// ============================================================================================
class WorksheetWriter {
    id;
    name;
    state;
    _rows;
    _columns;
    _keys;
    _merges;
    _sheetRelsWriter;
    _sheetCommentsWriter;
    _dimensions;
    views;
    autoFilter;
    _headerFooter;
    rowBreaks;
    _rowBreaks;
    dataValidations;
    constructor(options) {
        // in a workbook, each sheet will have a number
        this.id = options.id;
        // and a name
        this.name = options.name || `Sheet${this.id}`;
        // add a state
        this.state = options.state || 'visible';
        // rows are stored here while they need to be worked on.
        // when they are committed, they will be deleted.
        this._rows = [];
        // column definitions
        this._columns = null;
        // column keys (addRow convenience): key ==> this._columns index
        this._keys = {};
        // keep a record of all row and column pageBreaks
        this._merges = [];
        this._merges.add = function () { }; // ignore cell instruction
        // keep record of all hyperlinks
        this._sheetRelsWriter = new sheet_rels_writer_1.default(options);
        this._sheetCommentsWriter = new sheet_comments_writer_1.default(this, this._sheetRelsWriter, options);
        // keep a record of dimensions
        this._dimensions = new range_1.default();
        // first uncommitted row
        this._rowZero = 1;
        // committed flag
        this.committed = false;
        // for data validations
        this.dataValidations = new data_validations_1.default();
        // for sharing formulae
        this._formulae = {};
        this._siFormulae = 0;
        // keep a record of conditionalFormattings
        this.conditionalFormatting = [];
        // keep a record of all row and column pageBreaks
        this.rowBreaks = [];
        // for default row height, outline levels, etc
        this.properties = Object.assign({}, {
            defaultRowHeight: 15,
            dyDescent: 55,
            outlineLevelCol: 0,
            outlineLevelRow: 0,
        }, options.properties);
        this.headerFooter = Object.assign({}, {
            differentFirst: false,
            differentOddEven: false,
            oddHeader: null,
            oddFooter: null,
            evenHeader: null,
            evenFooter: null,
            firstHeader: null,
            firstFooter: null,
        }, options.headerFooter);
        // for all things printing
        this.pageSetup = Object.assign({}, {
            margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
            orientation: 'portrait',
            horizontalDpi: 4294967295,
            verticalDpi: 4294967295,
            fitToPage: !!(options.pageSetup &&
                (options.pageSetup.fitToWidth || options.pageSetup.fitToHeight) &&
                !options.pageSetup.scale),
            pageOrder: 'downThenOver',
            blackAndWhite: false,
            draft: false,
            cellComments: 'None',
            errors: 'displayed',
            scale: 100,
            fitToWidth: 1,
            fitToHeight: 1,
            paperSize: undefined,
            showRowColHeaders: false,
            showGridLines: false,
            horizontalCentered: false,
            verticalCentered: false,
            rowBreaks: null,
            colBreaks: null,
        }, options.pageSetup);
        // using shared strings creates a smaller xlsx file but may use more memory
        this.useSharedStrings = options.useSharedStrings || false;
        this._workbook = options.workbook;
        this.hasComments = false;
        // views
        this._views = options.views || [];
        // auto filter
        this.autoFilter = options.autoFilter || null;
        this._media = [];
        // worksheet protection
        this.sheetProtection = null;
        // start writing to stream now
        this._writeOpenWorksheet();
        this.startedData = false;
    }
    get workbook() {
        return this._workbook;
    }
    get stream() {
        if (!this._stream) {
            // eslint-disable-next-line no-underscore-dangle
            this._stream = this._workbook._openStream(`/xl/worksheets/sheet${this.id}.xml`);
            // pause stream to prevent 'data' events
            this._stream.pause();
        }
        return this._stream;
    }
    // destroy - not a valid operation for a streaming writer
    // even though some streamers might be able to, it's a bad idea.
    destroy() {
        throw new Error('Invalid Operation: destroy');
    }
    commit() {
        if (this.committed) {
            return;
        }
        // commit all rows
        this._rows.forEach((cRow) => {
            if (cRow) {
                // write the row to the stream
                this._writeRow(cRow);
            }
        });
        // we _cannot_ accept new rows from now on
        this._rows = null;
        if (!this.startedData) {
            this._writeOpenSheetData();
        }
        this._writeCloseSheetData();
        this._writeAutoFilter();
        this._writeMergeCells();
        // for some reason, Excel can't handle dimensions at the bottom of the file
        // this._writeDimensions();
        this._writeHyperlinks();
        this._writeConditionalFormatting();
        this._writeDataValidations();
        this._writeSheetProtection();
        this._writePageMargins();
        this._writePageSetup();
        this._writeBackground();
        this._writeHeaderFooter();
        this._writeRowBreaks();
        // Legacy Data tag for comments
        this._writeLegacyData();
        this._writeCloseWorksheet();
        // signal end of stream to workbook
        this.stream.end();
        this._sheetCommentsWriter.commit();
        // also commit the hyperlinks if any
        this._sheetRelsWriter.commit();
        this.committed = true;
    }
    // return the current dimensions of the writer
    get dimensions() {
        return this._dimensions;
    }
    get views() {
        return this._views;
    }
    // =========================================================================
    // Columns
    // get the current columns array.
    get columns() {
        return this._columns;
    }
    // set the columns from an array of column definitions.
    // Note: any headers defined will overwrite existing values.
    set columns(value) {
        // calculate max header row count
        this._headerRowCount = value.reduce((pv, cv) => {
            const headerCount = (cv.header && 1) || (cv.headers && cv.headers.length) || 0;
            return Math.max(pv, headerCount);
        }, 0);
        // construct Column objects
        let count = 1;
        const columns = (this._columns = []);
        value.forEach((defn) => {
            const column = new column_1.default(this, count++, false);
            columns.push(column);
            column.defn = defn;
        });
    }
    getColumnKey(key) {
        return this._keys[key];
    }
    setColumnKey(key, value) {
        this._keys[key] = value;
    }
    deleteColumnKey(key) {
        delete this._keys[key];
    }
    eachColumnKey(f) {
        under_dash_1.default.each(this._keys, f);
    }
    // get a single column by col number. If it doesn't exist, it and any gaps before it
    // are created.
    getColumn(c) {
        if (typeof c === 'string') {
            // if it matches a key'd column, return that
            const col = this._keys[c];
            if (col)
                return col;
            // otherwise, assume letter
            c = col_cache_1.default.l2n(c);
        }
        if (!this._columns) {
            this._columns = [];
        }
        if (c > this._columns.length) {
            let n = this._columns.length + 1;
            while (n <= c) {
                this._columns.push(new column_1.default(this, n++));
            }
        }
        return this._columns[c - 1];
    }
    // =========================================================================
    // Rows
    get _nextRow() {
        return this._rowZero + this._rows.length;
    }
    // iterate over every uncommitted row in the worksheet, including maybe empty rows
    eachRow(options, iteratee) {
        if (!iteratee) {
            iteratee = options;
            options = undefined;
        }
        if (options && options.includeEmpty) {
            const n = this._nextRow;
            for (let i = this._rowZero; i < n; i++) {
                iteratee(this.getRow(i), i);
            }
        }
        else {
            this._rows.forEach((row) => {
                if (row.hasValues) {
                    iteratee(row, row.number);
                }
            });
        }
    }
    _commitRow(cRow) {
        // since rows must be written in order, we commit all rows up till and including cRow
        let found = false;
        while (this._rows.length && !found) {
            const row = this._rows.shift();
            this._rowZero++;
            if (row) {
                this._writeRow(row);
                found = row.number === cRow.number;
                this._rowZero = row.number + 1;
            }
        }
    }
    get lastRow() {
        // returns last uncommitted row
        if (this._rows.length) {
            return this._rows[this._rows.length - 1];
        }
        return undefined;
    }
    // find a row (if exists) by row number
    findRow(rowNumber) {
        const index = rowNumber - this._rowZero;
        return this._rows[index];
    }
    getRow(rowNumber) {
        const index = rowNumber - this._rowZero;
        // may fail if rows have been comitted
        if (index < 0) {
            throw new Error('Out of bounds: this row has been committed');
        }
        let row = this._rows[index];
        if (!row) {
            this._rows[index] = row = new row_1.default(this, rowNumber);
        }
        return row;
    }
    addRow(value) {
        const row = new row_1.default(this, this._nextRow);
        this._rows[row.number - this._rowZero] = row;
        row.values = value;
        return row;
    }
    // ================================================================================
    // Cells
    // returns the cell at [r,c] or address given by r. If not found, return undefined
    findCell(r, c) {
        const address = col_cache_1.default.getAddress(r, c);
        const row = this.findRow(address.row);
        return row ? row.findCell(address.column) : undefined;
    }
    // return the cell at [r,c] or address given by r. If not found, create a new one.
    getCell(r, c) {
        const address = col_cache_1.default.getAddress(r, c);
        const row = this.getRow(address.row);
        return row.getCellEx(address);
    }
    mergeCells(...cells) {
        // may fail if rows have been comitted
        const dimensions = new range_1.default(cells);
        // check cells aren't already merged
        this._merges.forEach((merge) => {
            if (merge.intersects(dimensions)) {
                throw new Error('Cannot merge already merged cells');
            }
        });
        // apply merge
        const master = this.getCell(dimensions.top, dimensions.left);
        for (let i = dimensions.top; i <= dimensions.bottom; i++) {
            for (let j = dimensions.left; j <= dimensions.right; j++) {
                if (i > dimensions.top || j > dimensions.left) {
                    this.getCell(i, j).merge(master);
                }
            }
        }
        // index merge
        this._merges.push(dimensions);
    }
    // ===========================================================================
    // Conditional Formatting
    addConditionalFormatting(cf) {
        this.conditionalFormatting.push(cf);
    }
    removeConditionalFormatting(filter) {
        if (typeof filter === 'number') {
            this.conditionalFormatting.splice(filter, 1);
        }
        else if (filter instanceof Function) {
            this.conditionalFormatting = this.conditionalFormatting.filter(filter);
        }
        else {
            this.conditionalFormatting = [];
        }
    }
    // =========================================================================
    addBackgroundImage(imageId) {
        this._background = {
            imageId,
        };
    }
    getBackgroundImageId() {
        return this._background && this._background.imageId;
    }
    // =========================================================================
    // Worksheet Protection
    protect(password, options) {
        // TODO: make this function truly async
        // perhaps marshal to worker thread or something
        return new Promise((resolve) => {
            this.sheetProtection = {
                sheet: true,
            };
            if (options && 'spinCount' in options) {
                // force spinCount to be integer >= 0
                options.spinCount = Number.isFinite(options.spinCount)
                    ? Math.round(Math.max(0, options.spinCount))
                    : 100000;
            }
            if (password) {
                this.sheetProtection.algorithmName = 'SHA-512';
                this.sheetProtection.saltValue = encryptor_1.default.randomBytes(16).toString('base64');
                this.sheetProtection.spinCount =
                    options && 'spinCount' in options ? options.spinCount : 100000; // allow user specified spinCount
                this.sheetProtection.hashValue = encryptor_1.default.convertPasswordToHash(password, 'SHA512', this.sheetProtection.saltValue, this.sheetProtection.spinCount);
            }
            if (options) {
                this.sheetProtection = Object.assign(this.sheetProtection, options);
                if (!password && 'spinCount' in options) {
                    delete this.sheetProtection.spinCount;
                }
            }
            resolve();
        });
    }
    unprotect() {
        this.sheetProtection = null;
    }
    // ================================================================================
    _write(text) {
        xmlBuffer.reset();
        xmlBuffer.addText(text);
        this.stream.write(xmlBuffer);
    }
    _writeSheetProperties(xmlBuf, properties, pageSetup) {
        const sheetPropertiesModel = {
            outlineProperties: properties && properties.outlineProperties,
            tabColor: properties && properties.tabColor,
            pageSetup: pageSetup && pageSetup.fitToPage
                ? {
                    fitToPage: pageSetup.fitToPage,
                }
                : undefined,
        };
        xmlBuf.addText(xform.sheetProperties.toXml(sheetPropertiesModel));
    }
    _writeSheetFormatProperties(xmlBuf, properties) {
        const sheetFormatPropertiesModel = properties
            ? {
                defaultRowHeight: properties.defaultRowHeight,
                dyDescent: properties.dyDescent,
                outlineLevelCol: properties.outlineLevelCol,
                outlineLevelRow: properties.outlineLevelRow,
            }
            : undefined;
        if (properties.defaultColWidth) {
            sheetFormatPropertiesModel.defaultColWidth = properties.defaultColWidth;
        }
        xmlBuf.addText(xform.sheetFormatProperties.toXml(sheetFormatPropertiesModel));
    }
    _writeOpenWorksheet() {
        xmlBuffer.reset();
        xmlBuffer.addText('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
        xmlBuffer.addText('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
            ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' +
            ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"' +
            ' mc:Ignorable="x14ac"' +
            ' xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">');
        this._writeSheetProperties(xmlBuffer, this.properties, this.pageSetup);
        xmlBuffer.addText(xform.sheetViews.toXml(this.views));
        this._writeSheetFormatProperties(xmlBuffer, this.properties);
        this.stream.write(xmlBuffer);
    }
    _writeColumns() {
        const cols = column_1.default.toModel(this.columns);
        if (cols) {
            xform.columns.prepare(cols, { styles: this._workbook.styles });
            this.stream.write(xform.columns.toXml(cols));
        }
    }
    _writeOpenSheetData() {
        this._write('<sheetData>');
    }
    _writeRow(row) {
        if (!this.startedData) {
            this._writeColumns();
            this._writeOpenSheetData();
            this.startedData = true;
        }
        if (row.hasValues || row.height) {
            const { model } = row;
            const options = {
                styles: this._workbook.styles,
                sharedStrings: this.useSharedStrings ? this._workbook.sharedStrings : undefined,
                hyperlinks: this._sheetRelsWriter.hyperlinksProxy,
                merges: this._merges,
                formulae: this._formulae,
                siFormulae: this._siFormulae,
                comments: [],
            };
            xform.row.prepare(model, options);
            this.stream.write(xform.row.toXml(model));
            if (options.comments.length) {
                this.hasComments = true;
                this._sheetCommentsWriter.addComments(options.comments);
            }
        }
    }
    _writeCloseSheetData() {
        this._write('</sheetData>');
    }
    _writeMergeCells() {
        if (this._merges.length) {
            xmlBuffer.reset();
            xmlBuffer.addText(`<mergeCells count="${this._merges.length}">`);
            this._merges.forEach((merge) => {
                xmlBuffer.addText(`<mergeCell ref="${merge}"/>`);
            });
            xmlBuffer.addText('</mergeCells>');
            this.stream.write(xmlBuffer);
        }
    }
    _writeHyperlinks() {
        // eslint-disable-next-line no-underscore-dangle
        this.stream.write(xform.hyperlinks.toXml(this._sheetRelsWriter._hyperlinks));
    }
    _writeConditionalFormatting() {
        const options = {
            styles: this._workbook.styles,
        };
        xform.conditionalFormattings.prepare(this.conditionalFormatting, options);
        this.stream.write(xform.conditionalFormattings.toXml(this.conditionalFormatting));
    }
    _writeRowBreaks() {
        this.stream.write(xform.rowBreaks.toXml(this.rowBreaks));
    }
    _writeDataValidations() {
        this.stream.write(xform.dataValidations.toXml(this.dataValidations.model));
    }
    _writeSheetProtection() {
        this.stream.write(xform.sheetProtection.toXml(this.sheetProtection));
    }
    _writePageMargins() {
        this.stream.write(xform.pageMargins.toXml(this.pageSetup.margins));
    }
    _writePageSetup() {
        this.stream.write(xform.pageSeteup.toXml(this.pageSetup));
    }
    _writeHeaderFooter() {
        this.stream.write(xform.headerFooter.toXml(this.headerFooter));
    }
    _writeAutoFilter() {
        this.stream.write(xform.autoFilter.toXml(this.autoFilter));
    }
    _writeBackground() {
        if (this._background) {
            if (this._background.imageId !== undefined) {
                const image = this._workbook.getImage(this._background.imageId);
                const pictureId = this._sheetRelsWriter.addMedia({
                    Target: `../media/${image.name}`,
                    Type: rel_type_1.default.Image,
                });
                this._background = {
                    ...this._background,
                    rId: pictureId,
                };
            }
            this.stream.write(xform.picture.toXml({ rId: this._background.rId }));
        }
    }
    _writeLegacyData() {
        if (this.hasComments) {
            xmlBuffer.reset();
            xmlBuffer.addText(`<legacyDrawing r:id="${this._sheetCommentsWriter.vmlRelId}"/>`);
            this.stream.write(xmlBuffer);
        }
    }
    _writeDimensions() {
        // for some reason, Excel can't handle dimensions at the bottom of the file
        // and we don't know the dimensions until the commit, so don't write them.
        // this._write('<dimension ref="' + this._dimensions + '"/>');
    }
    _writeCloseWorksheet() {
        this._write('</worksheet>');
    }
}
exports.default = WorksheetWriter;
