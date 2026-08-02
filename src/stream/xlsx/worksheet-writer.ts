import _ from '#src/utils/helpers/under-dash';

import RelType from '#src/xlsx/rel-type';

import colCache from '#src/utils/data/col-cache';
import Encryptor from '#src/utils/crypto/encryptor';
import Dimensions from '#src/doc/range';
import Row from '#src/doc/row';
import Column from '#src/doc/column';

import SheetRelsWriter from '#src/stream/xlsx/sheet-rels-writer';
import SheetCommentsWriter from '#src/stream/xlsx/sheet-comments-writer';
import DataValidations from '#src/doc/data-validations';
// ============================================================================================
// Xforms
import ListXform from '#src/xlsx/xform/list-xform';
import DataValidationsXform from '#src/xlsx/xform/sheet/data-validations-xform';
import SheetPropertiesXform from '#src/xlsx/xform/sheet/sheet-properties-xform';
import SheetFormatPropertiesXform from '#src/xlsx/xform/sheet/sheet-format-properties-xform';
import ColXform from '#src/xlsx/xform/sheet/col-xform';
import RowXform from '#src/xlsx/xform/sheet/row-xform';
import HyperlinkXform from '#src/xlsx/xform/sheet/hyperlink-xform';
import SheetViewXform from '#src/xlsx/xform/sheet/sheet-view-xform';
import SheetProtectionXform from '#src/xlsx/xform/sheet/sheet-protection-xform';
import PageMarginsXform from '#src/xlsx/xform/sheet/page-margins-xform';
import PageSetupXform from '#src/xlsx/xform/sheet/page-setup-xform';
import AutoFilterXform from '#src/xlsx/xform/sheet/auto-filter-xform';
import PictureXform from '#src/xlsx/xform/sheet/picture-xform';
import ConditionalFormattingsXform from '#src/xlsx/xform/sheet/cf/conditional-formattings-xform';
import HeaderFooterXform from '#src/xlsx/xform/sheet/header-footer-xform';
import RowBreaksXform from '#src/xlsx/xform/sheet/row-breaks-xform';
import PrintOptionsXform from '#src/xlsx/xform/sheet/print-options-xform';

// since prepare and render are functional, we can use singletons
const xform = {
  dataValidations: new DataValidationsXform(),
  sheetProperties: new SheetPropertiesXform(),
  sheetFormatProperties: new SheetFormatPropertiesXform(),
  columns: new ListXform({ tag: 'cols', length: false, childXform: new ColXform() }),
  row: new RowXform(),
  hyperlinks: new ListXform({ tag: 'hyperlinks', length: false, childXform: new HyperlinkXform() }),
  sheetViews: new ListXform({ tag: 'sheetViews', length: false, childXform: new SheetViewXform() }),
  sheetProtection: new SheetProtectionXform(),
  printOptions: new PrintOptionsXform(),
  pageMargins: new PageMarginsXform(),
  pageSeteup: new PageSetupXform(),
  autoFilter: new AutoFilterXform(),
  picture: new PictureXform(),
  conditionalFormattings: new ConditionalFormattingsXform(),
  headerFooter: new HeaderFooterXform(),
  rowBreaks: new RowBreaksXform(),
};

// ============================================================================================

class WorksheetWriter {
  id: any;
  name: string;
  state: any;
  _rows: any;
  _columns: any;
  _keys: any;
  _merges: any;
  _sheetRelsWriter: any;
  _sheetCommentsWriter: any;
  _dimensions: any;
  autoFilter: any;
  _headerFooter: any;
  rowBreaks: any[];
  _rowBreaks: any;
  dataValidations: any;
  _rowZero: any;
  committed: any;
  _formulae: any;
  _siFormulae: any;
  conditionalFormatting: any;
  properties: any;
  headerFooter: any;
  pageSetup: any;
  useSharedStrings: any;
  _workbook: any;
  hasComments: any;
  _views: any;
  _media: any;
  sheetProtection: any;
  startedData: any;
  _stream: any;
  _background: any;
  _headerRowCount: any;

  constructor(options?: any) {
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
    this._merges.add = function () {}; // ignore cell instruction

    // keep record of all hyperlinks
    this._sheetRelsWriter = new SheetRelsWriter(options);

    this._sheetCommentsWriter = new SheetCommentsWriter(this, this._sheetRelsWriter, options);

    // keep a record of dimensions
    this._dimensions = new Dimensions();

    // first uncommitted row
    this._rowZero = 1;

    // committed flag
    this.committed = false;

    // for data validations
    this.dataValidations = new DataValidations();

    // for sharing formulae
    this._formulae = {};
    this._siFormulae = 0;

    // keep a record of conditionalFormattings
    this.conditionalFormatting = [];

    // keep a record of all row and column pageBreaks
    this.rowBreaks = [];

    // for default row height, outline levels, etc
    this.properties = Object.assign(
      {},
      {
        defaultRowHeight: 15,
        dyDescent: 55,
        outlineLevelCol: 0,
        outlineLevelRow: 0,
      },
      options.properties
    );

    this.headerFooter = Object.assign(
      {},
      {
        differentFirst: false,
        differentOddEven: false,
        oddHeader: null,
        oddFooter: null,
        evenHeader: null,
        evenFooter: null,
        firstHeader: null,
        firstFooter: null,
      },
      options.headerFooter
    );

    // for all things printing
    this.pageSetup = Object.assign(
      {},
      {
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
        orientation: 'portrait',
        horizontalDpi: 4294967295,
        verticalDpi: 4294967295,
        fitToPage: !!(
          options.pageSetup &&
          (options.pageSetup.fitToWidth || options.pageSetup.fitToHeight) &&
          !options.pageSetup.scale
        ),
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
      },
      options.pageSetup
    );

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
      this._stream = this._workbook._openStream(`xl/worksheets/sheet${this.id}.xml`);

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
    this._rows.forEach((cRow: any) => {
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
    this._writeSheetProtection();
    this._writeAutoFilter();
    this._writeMergeCells();

    // for some reason, Excel can't handle dimensions at the bottom of the file
    // this._writeDimensions();

    this._writeConditionalFormatting();
    this._writeDataValidations();
    this._writeHyperlinks();
    this._writeRowBreaks();
    this._writePrintOptions();
    this._writePageMargins();
    this._writePageSetup();
    this._writeHeaderFooter();
    this._writeBackground();
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

  set views(value: any) {
    this._views = value;
  }

  // =========================================================================
  // Columns

  // get the current columns array.
  get columns() {
    return this._columns;
  }

  // set the columns from an array of column definitions.
  // Note: any headers defined will overwrite existing values.
  set columns(value: any) {
    // calculate max header row count
    this._headerRowCount = value.reduce((pv: any, cv: any) => {
      const headerCount = (cv.header && 1) || (cv.headers && cv.headers.length) || 0;
      return Math.max(pv, headerCount);
    }, 0);

    // construct Column objects
    let count = 1;
    const columns: any[] = (this._columns = []);
    value.forEach((defn: any) => {
      const column = new Column(this, count++, false);
      columns.push(column);
      column.defn = defn;
    });
  }

  getColumnKey(key: any) {
    return this._keys[key];
  }

  setColumnKey(key: any, value: any) {
    this._keys[key] = value;
  }

  deleteColumnKey(key: any) {
    delete this._keys[key];
  }

  eachColumnKey(f: any) {
    _.each(this._keys, f);
  }

  // get a single column by col number. If it doesn't exist, it and any gaps before it
  // are created.
  getColumn(c: any) {
    if (typeof c === 'string') {
      // if it matches a key'd column, return that
      const col = this._keys[c];
      if (col) return col;

      // otherwise, assume letter
      c = colCache.l2n(c);
    }
    if (!this._columns) {
      this._columns = [];
    }
    if (c > this._columns.length) {
      let n = this._columns.length + 1;
      while (n <= c) {
        this._columns.push(new Column(this, n++));
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
  eachRow(options: any, iteratee: any) {
    if (!iteratee) {
      iteratee = options;
      options = undefined;
    }
    if (options && options.includeEmpty) {
      const n = this._nextRow;
      for (let i = this._rowZero; i < n; i++) {
        iteratee(this.getRow(i), i);
      }
    } else {
      this._rows.forEach((row: any) => {
        if (row.hasValues) {
          iteratee(row, row.number);
        }
      });
    }
  }

  _commitRow(cRow: any) {
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
  findRow(rowNumber: any) {
    const index = rowNumber - this._rowZero;
    return this._rows[index];
  }

  getRow(rowNumber: any) {
    const index = rowNumber - this._rowZero;

    // may fail if rows have been comitted
    if (index < 0) {
      throw new Error('Out of bounds: this row has been committed');
    }
    let row = this._rows[index];
    if (!row) {
      this._rows[index] = row = new Row(this, rowNumber);
    }
    return row;
  }

  addRow(value: any) {
    const row = new Row(this, this._nextRow);
    this._rows[row.number - this._rowZero] = row;
    row.values = value;
    return row;
  }

  // ================================================================================
  // Cells

  // returns the cell at [r,c] or address given by r. If not found, return undefined
  findCell(r: any, c: any) {
    const address = colCache.getAddress(r, c);
    const row = this.findRow(address.row);
    return row ? row.findCell(address.col) : undefined;
  }

  // return the cell at [r,c] or address given by r. If not found, create a new one.
  getCell(r: any, c: any) {
    const address = colCache.getAddress(r, c);
    const row = this.getRow(address.row);
    return row.getCellEx(address);
  }

  mergeCells(...cells: any) {
    // may fail if rows have been comitted
    const dimensions = new Dimensions(cells);

    // check cells aren't already merged
    this._merges.forEach((merge: any) => {
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
  addConditionalFormatting(cf: any) {
    this.conditionalFormatting.push(cf);
  }

  removeConditionalFormatting(filter: any) {
    if (typeof filter === 'number') {
      this.conditionalFormatting.splice(filter, 1);
    } else if (filter instanceof Function) {
      this.conditionalFormatting = this.conditionalFormatting.filter(filter);
    } else {
      this.conditionalFormatting = [];
    }
  }

  // =========================================================================

  addBackgroundImage(imageId: any) {
    this._background = {
      imageId,
    };
  }

  getBackgroundImageId() {
    return this._background && this._background.imageId;
  }

  // =========================================================================
  // Worksheet Protection
  protect(password: any, options: any) {
    // TODO: make this function truly async
    // perhaps marshal to worker thread or something
    return new Promise<void>((resolve) => {
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
        this.sheetProtection.saltValue = Encryptor.randomBytes(16).toString('base64');
        this.sheetProtection.spinCount =
          options && 'spinCount' in options ? options.spinCount : 100000; // allow user specified spinCount
        this.sheetProtection.hashValue = Encryptor.convertPasswordToHash(
          password,
          'SHA512',
          this.sheetProtection.saltValue,
          this.sheetProtection.spinCount
        );
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

  _write(text: any) {
    this.stream.write(text);
  }

  _writeSheetProperties(parts: string[], properties: any, pageSetup: any) {
    const sheetPropertiesModel = {
      outlineProperties: properties && properties.outlineProperties,
      tabColor: properties && properties.tabColor,
      pageSetup:
        pageSetup && pageSetup.fitToPage
          ? {
              fitToPage: pageSetup.fitToPage,
            }
          : undefined,
    };

    parts.push(xform.sheetProperties.toXml(sheetPropertiesModel));
  }

  _writeSheetFormatProperties(parts: string[], properties: any) {
    const sheetFormatPropertiesModel = properties
      ? {
          defaultRowHeight: properties.defaultRowHeight,
          dyDescent: properties.dyDescent,
          outlineLevelCol: properties.outlineLevelCol,
          outlineLevelRow: properties.outlineLevelRow,
        }
      : undefined;
    if (sheetFormatPropertiesModel && properties.defaultColWidth) {
      (sheetFormatPropertiesModel as any).defaultColWidth = properties.defaultColWidth;
    }

    parts.push(xform.sheetFormatProperties.toXml(sheetFormatPropertiesModel));
  }

  _writeOpenWorksheet() {
    const parts = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"' +
        ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' +
        ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"' +
        ' mc:Ignorable="x14ac"' +
        ' xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">',
    ];

    this._writeSheetProperties(parts, this.properties, this.pageSetup);

    parts.push(xform.sheetViews.toXml(this.views));

    this._writeSheetFormatProperties(parts, this.properties);

    this.stream.write(parts.join(''));
  }

  _writeColumns() {
    const cols = Column.toModel(this.columns);
    if (cols) {
      xform.columns.prepare(cols, { styles: this._workbook.styles });
      this.stream.write(xform.columns.toXml(cols));
    }
  }

  _writeOpenSheetData() {
    this._write('<sheetData>');
  }

  _writeRow(row: any) {
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
      const parts = [`<mergeCells count="${this._merges.length}">`];
      this._merges.forEach((merge: any) => {
        parts.push(`<mergeCell ref="${merge}"/>`);
      });
      parts.push('</mergeCells>');

      this.stream.write(parts.join(''));
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

  _writeSheetProtection() {
    this.stream.write(xform.sheetProtection.toXml(this.sheetProtection));
  }

  _writeAutoFilter() {
    this.stream.write(xform.autoFilter.toXml(this.autoFilter));
  }

  _writeRowBreaks() {
    this.stream.write(xform.rowBreaks.toXml(this.rowBreaks));
  }

  _writeDataValidations() {
    this.stream.write(xform.dataValidations.toXml(this.dataValidations.model));
  }

  _writePrintOptions() {
    this.stream.write(xform.printOptions.toXml(this.pageSetup));
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

  _writeBackground() {
    if (this._background) {
      if (this._background.imageId !== undefined) {
        const image = this._workbook.getImage(this._background.imageId);
        const pictureId = this._sheetRelsWriter.addMedia({
          Target: `../media/${image.name}`,
          Type: RelType.Image,
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
      this.stream.write(`<legacyDrawing r:id="${this._sheetCommentsWriter.vmlRelId}"/>`);
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

export default WorksheetWriter;
