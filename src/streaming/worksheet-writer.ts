import _ from '../utils/helpers/under-dash';

import RelType from '../formats/xlsx/rel-type';

import colCache from '../utils/data/col-cache';
import Encryptor from '../utils/crypto/encryptor';
import Dimensions from '../core/range';
import Row from '../core/row';
import Column from '../core/column';
import type { WorksheetLike, CellLike } from '../core/internal-types';
import type WorkbookWriter from './workbook-writer';

import SheetRelsWriter from './sheet-rels-writer';
import type { RelsWorkbook } from './sheet-rels-writer';
import SheetCommentsWriter from './sheet-comments-writer';
import type { CommentsWorkbook } from './sheet-comments-writer';
import DataValidations from '../core/data-validations';
import type { ColumnDefinition } from '../core/column';
// ============================================================================================
// Xforms
import ListXform from '../formats/xlsx/xml/list-xform';
import DataValidationsXform from '../formats/xlsx/xml/sheet/data-validations-xform';
import SheetPropertiesXform from '../formats/xlsx/xml/sheet/sheet-properties-xform';
import SheetFormatPropertiesXform from '../formats/xlsx/xml/sheet/sheet-format-properties-xform';
import ColXform from '../formats/xlsx/xml/sheet/col-xform';
import RowXform from '../formats/xlsx/xml/sheet/row-xform';
import HyperlinkXform from '../formats/xlsx/xml/sheet/hyperlink-xform';
import SheetViewXform from '../formats/xlsx/xml/sheet/sheet-view-xform';
import SheetProtectionXform from '../formats/xlsx/xml/sheet/sheet-protection-xform';
import PageMarginsXform from '../formats/xlsx/xml/sheet/page-margins-xform';
import PageSetupXform from '../formats/xlsx/xml/sheet/page-setup-xform';
import AutoFilterXform from '../formats/xlsx/xml/sheet/auto-filter-xform';
import PictureXform from '../formats/xlsx/xml/sheet/picture-xform';
import ConditionalFormattingsXform from '../formats/xlsx/xml/sheet/cf/conditional-formattings-xform';
import HeaderFooterXform from '../formats/xlsx/xml/sheet/header-footer-xform';
import RowBreaksXform from '../formats/xlsx/xml/sheet/row-breaks-xform';
import PrintOptionsXform from '../formats/xlsx/xml/sheet/print-options-xform';

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

import type {
  WorksheetProperties,
  WorksheetState,
  PageSetup,
  HeaderFooter,
  WorksheetView,
  AutoFilter,
} from '../core/worksheet';

export interface WorksheetWriterOptions {
  id: number;
  name?: string;
  workbook: WorkbookWriter;
  useSharedStrings?: boolean;
  properties?: Partial<WorksheetProperties>;
  state?: WorksheetState;
  pageSetup?: Partial<PageSetup>;
  views?: Array<Partial<WorksheetView>>;
  autoFilter?: AutoFilter;
  headerFooter?: Partial<HeaderFooter>;
}

class WorksheetWriter {
  id: number;
  name: string;
  state: string;
  _rows: (Row | undefined | null)[] | null;
  _columns: Column[] | null;
  _keys: Record<string, Column>;
  _merges: Dimensions[] & { add?: () => void };
  _sheetRelsWriter: SheetRelsWriter;
  _sheetCommentsWriter: SheetCommentsWriter;
  _dimensions: Dimensions;
  autoFilter: unknown;
  _headerFooter: unknown;
  rowBreaks: unknown[];
  _rowBreaks: unknown;
  dataValidations: DataValidations;
  _rowZero: number;
  committed: boolean;
  _formulae: Record<string, unknown>;
  _siFormulae: number;
  conditionalFormatting: unknown[];
  properties: Record<string, unknown>;
  headerFooter: Record<string, unknown>;
  pageSetup: Record<string, unknown>;
  useSharedStrings: boolean;
  _workbook: WorkbookWriter;
  hasComments: boolean;
  _views: unknown[];
  _media: unknown[];
  sheetProtection: Record<string, unknown> | null;
  startedData: boolean;
  _stream: NodeJS.WritableStream | undefined;
  _background: { imageId?: number; rId?: string } | undefined;
  _headerRowCount: number | undefined;

  constructor(options: WorksheetWriterOptions) {
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
    this._merges = [] as unknown as Dimensions[] & { add?: () => void };
    this._merges.add = function () {}; // ignore cell instruction

    // keep record of all hyperlinks
    this._sheetRelsWriter = new SheetRelsWriter(
      options as unknown as {
        id: number;
        workbook: RelsWorkbook;
      }
    );

    this._sheetCommentsWriter = new SheetCommentsWriter(
      this,
      this._sheetRelsWriter,
      options as unknown as {
        id: number;
        workbook: CommentsWorkbook;
      }
    );

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
          ((options.pageSetup as Record<string, unknown>).fitToWidth ||
            (options.pageSetup as Record<string, unknown>).fitToHeight) &&
          !(options.pageSetup as Record<string, unknown>).scale
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

  get workbook(): WorkbookWriter {
    return this._workbook;
  }

  get stream(): NodeJS.WritableStream {
    if (!this._stream) {
      // eslint-disable-next-line no-underscore-dangle
      this._stream = (
        this._workbook as unknown as {
          _openStream(path: string): NodeJS.WritableStream & { pause(): void };
        }
      )._openStream(`xl/worksheets/sheet${this.id}.xml`);

      // pause stream to prevent 'data' events
      (this._stream as unknown as { pause(): void }).pause();
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
    (this._rows as (Row | undefined | null)[]).forEach((cRow) => {
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
    (this.stream as unknown as { end(): void }).end();

    this._sheetCommentsWriter.commit();
    // also commit the hyperlinks if any
    this._sheetRelsWriter.commit();

    this.committed = true;
  }

  // return the current dimensions of the writer
  get dimensions(): Dimensions {
    return this._dimensions;
  }

  get views(): unknown[] {
    return this._views;
  }

  set views(value: unknown[]) {
    this._views = value;
  }

  // =========================================================================
  // Columns

  // get the current columns array.
  get columns(): Column[] | null {
    return this._columns;
  }

  // set the columns from an array of column definitions.
  // Note: any headers defined will overwrite existing values.
  set columns(value: Record<string, unknown>[]) {
    // calculate max header row count
    this._headerRowCount = value.reduce((pv: number, cv: Record<string, unknown>) => {
      const headerCount = (cv.header && 1) || ((cv.headers as unknown[])?.length ?? 0) || 0;
      return Math.max(pv, headerCount as number);
    }, 0);

    // construct Column objects
    let count = 1;
    const columns: Column[] = (this._columns = []);
    value.forEach((defn) => {
      const column = new Column(this as unknown as WorksheetLike, count++, false);
      columns.push(column);
      column.defn = defn as unknown as ColumnDefinition;
    });
  }

  getColumnKey(key: string): Column | undefined {
    return this._keys[key];
  }

  setColumnKey(key: string, value: Column) {
    this._keys[key] = value;
  }

  deleteColumnKey(key: string) {
    delete this._keys[key];
  }

  eachColumnKey(f: (column: Column, key: string) => void) {
    _.each(this._keys, f);
  }

  // get a single column by col number. If it doesn't exist, it and any gaps before it
  // are created.
  getColumn(c: number | string): Column {
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
        this._columns.push(new Column(this as unknown as WorksheetLike, n++));
      }
    }
    return this._columns[c - 1];
  }

  // =========================================================================
  // Rows
  get _nextRow(): number {
    return this._rowZero + (this._rows as unknown[]).length;
  }

  // iterate over every uncommitted row in the worksheet, including maybe empty rows
  eachRow(
    options: { includeEmpty?: boolean } | ((row: Row, rowNumber: number) => void),
    iteratee?: (row: Row, rowNumber: number) => void
  ) {
    if (!iteratee) {
      iteratee = options as (row: Row, rowNumber: number) => void;
      options = undefined as unknown as { includeEmpty?: boolean };
    }
    if (options && (options as { includeEmpty?: boolean }).includeEmpty) {
      const n = this._nextRow;
      for (let i = this._rowZero; i < n; i++) {
        iteratee(this.getRow(i), i);
      }
    } else {
      (this._rows as (Row | undefined | null)[]).forEach((row) => {
        if (row && row.hasValues) {
          (iteratee as (row: Row, rowNumber: number) => void)(row, row.number);
        }
      });
    }
  }

  _commitRow(cRow: Row) {
    // since rows must be written in order, we commit all rows up till and including cRow
    let found = false;
    const rows = this._rows as (Row | undefined | null)[];
    while (rows.length && !found) {
      const row = rows.shift();
      this._rowZero++;
      if (row) {
        this._writeRow(row);
        found = row.number === cRow.number;
        this._rowZero = row.number + 1;
      }
    }
  }

  get lastRow(): Row | undefined | null {
    // returns last uncommitted row
    const rows = this._rows as (Row | undefined | null)[];
    if (rows.length) {
      return rows[rows.length - 1];
    }
    return undefined;
  }

  // find a row (if exists) by row number
  findRow(rowNumber: number): Row | undefined | null {
    const index = rowNumber - this._rowZero;
    return (this._rows as (Row | undefined | null)[])[index];
  }

  getRow(rowNumber: number): Row {
    const index = rowNumber - this._rowZero;

    // may fail if rows have been comitted
    if (index < 0) {
      throw new Error('Out of bounds: this row has been committed');
    }
    const rows = this._rows as (Row | undefined | null)[];
    let row = rows[index];
    if (!row) {
      rows[index] = row = new Row(this as unknown as WorksheetLike, rowNumber);
    }
    return row;
  }

  addRow(value: unknown): Row {
    const row = new Row(this as unknown as WorksheetLike, this._nextRow);
    (this._rows as (Row | undefined | null)[])[row.number - this._rowZero] = row;
    row.values = value as unknown[] | Record<string, unknown> | undefined | null;
    return row;
  }

  // ================================================================================
  // Cells

  // returns the cell at [r,c] or address given by r. If not found, return undefined
  findCell(r: number | string, c?: number): CellLike | undefined {
    const address = colCache.getAddress(r, c);
    const row = this.findRow(address.row);
    return row ? row.findCell(address.col) : undefined;
  }

  // return the cell at [r,c] or address given by r. If not found, create a new one.
  getCell(r: number | string, c?: number): CellLike {
    const address = colCache.getAddress(r, c);
    const row = this.getRow(address.row);
    return row.getCellEx(address);
  }

  mergeCells(...cells: unknown[]) {
    // may fail if rows have been comitted
    const dimensions = new Dimensions(cells);

    // check cells aren't already merged
    this._merges.forEach((merge) => {
      if (merge.intersects(dimensions.model)) {
        throw new Error('Cannot merge already merged cells');
      }
    });

    // apply merge
    const master = this.getCell(dimensions.top, dimensions.left);
    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        if (i > dimensions.top || j > dimensions.left) {
          (this.getCell(i, j) as unknown as { merge(m: unknown): void }).merge(master);
        }
      }
    }

    // index merge
    this._merges.push(dimensions);
  }

  // ===========================================================================
  // Conditional Formatting
  addConditionalFormatting(cf: unknown) {
    this.conditionalFormatting.push(cf);
  }

  removeConditionalFormatting(filter: number | ((cf: unknown) => boolean)) {
    if (typeof filter === 'number') {
      this.conditionalFormatting.splice(filter, 1);
    } else if (filter instanceof Function) {
      this.conditionalFormatting = this.conditionalFormatting.filter(filter);
    } else {
      this.conditionalFormatting = [];
    }
  }

  // =========================================================================

  addBackgroundImage(imageId: number) {
    this._background = {
      imageId,
    };
  }

  getBackgroundImageId(): number | undefined {
    return this._background && this._background.imageId;
  }

  // =========================================================================
  // Worksheet Protection
  protect(password: string | undefined, options: Record<string, unknown> | undefined) {
    // TODO: make this function truly async
    // perhaps marshal to worker thread or something
    return new Promise<void>((resolve) => {
      this.sheetProtection = {
        sheet: true,
      };
      if (options && 'spinCount' in options) {
        // force spinCount to be integer >= 0
        options.spinCount = Number.isFinite(options.spinCount)
          ? Math.round(Math.max(0, options.spinCount as number))
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
          this.sheetProtection.saltValue as string,
          this.sheetProtection.spinCount as number
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

  _write(text: string) {
    (this.stream as unknown as { write(t: string): void }).write(text);
  }

  _writeSheetProperties(
    parts: string[],
    properties: Record<string, unknown> | undefined,
    pageSetup: Record<string, unknown> | undefined
  ) {
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

  _writeSheetFormatProperties(parts: string[], properties: Record<string, unknown> | undefined) {
    const sheetFormatPropertiesModel = properties
      ? {
          defaultRowHeight: properties.defaultRowHeight,
          dyDescent: properties.dyDescent,
          outlineLevelCol: properties.outlineLevelCol,
          outlineLevelRow: properties.outlineLevelRow,
        }
      : undefined;
    if (sheetFormatPropertiesModel && properties!.defaultColWidth) {
      (sheetFormatPropertiesModel as Record<string, unknown>).defaultColWidth =
        properties!.defaultColWidth;
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

    (this.stream as unknown as { write(t: string): void }).write(parts.join(''));
  }

  _writeColumns() {
    const cols = Column.toModel(this.columns as Column[]);
    if (cols) {
      xform.columns.prepare(cols, {
        styles: (this._workbook as unknown as { styles: unknown }).styles,
      });
      (this.stream as unknown as { write(t: string): void }).write(xform.columns.toXml(cols));
    }
  }

  _writeOpenSheetData() {
    this._write('<sheetData>');
  }

  _writeRow(row: Row) {
    if (!this.startedData) {
      this._writeColumns();
      this._writeOpenSheetData();
      this.startedData = true;
    }

    if (row.hasValues || row.height) {
      const { model } = row;
      const options = {
        styles: (this._workbook as unknown as { styles: unknown }).styles,
        sharedStrings: this.useSharedStrings
          ? (this._workbook as unknown as { sharedStrings: unknown }).sharedStrings
          : undefined,
        hyperlinks: this._sheetRelsWriter.hyperlinksProxy,
        merges: this._merges,
        formulae: this._formulae,
        siFormulae: this._siFormulae,
        comments: [] as unknown[],
      };
      xform.row.prepare(model, options);
      (this.stream as unknown as { write(t: string): void }).write(xform.row.toXml(model));

      if (options.comments.length) {
        this.hasComments = true;
        this._sheetCommentsWriter.addComments(options.comments as Record<string, unknown>[]);
      }
    }
  }

  _writeCloseSheetData() {
    this._write('</sheetData>');
  }

  _writeMergeCells() {
    if (this._merges.length) {
      const parts = [`<mergeCells count="${this._merges.length}">`];
      this._merges.forEach((merge) => {
        parts.push(`<mergeCell ref="${merge}"/>`);
      });
      parts.push('</mergeCells>');

      (this.stream as unknown as { write(t: string): void }).write(parts.join(''));
    }
  }

  _writeHyperlinks() {
    // eslint-disable-next-line no-underscore-dangle
    (this.stream as unknown as { write(t: string): void }).write(
      xform.hyperlinks.toXml(this._sheetRelsWriter._hyperlinks)
    );
  }

  _writeConditionalFormatting() {
    const options = {
      styles: (this._workbook as unknown as { styles: unknown }).styles,
    };
    xform.conditionalFormattings.prepare(this.conditionalFormatting as any[], options);
    (this.stream as unknown as { write(t: string): void }).write(
      xform.conditionalFormattings.toXml(this.conditionalFormatting as any[])
    );
  }

  _writeSheetProtection() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.sheetProtection.toXml(this.sheetProtection)
    );
  }

  _writeAutoFilter() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.autoFilter.toXml(this.autoFilter)
    );
  }

  _writeRowBreaks() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.rowBreaks.toXml(this.rowBreaks)
    );
  }

  _writeDataValidations() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.dataValidations.toXml(this.dataValidations.model)
    );
  }

  _writePrintOptions() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.printOptions.toXml(this.pageSetup)
    );
  }

  _writePageMargins() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.pageMargins.toXml((this.pageSetup as { margins: unknown }).margins)
    );
  }

  _writePageSetup() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.pageSeteup.toXml(this.pageSetup)
    );
  }

  _writeHeaderFooter() {
    (this.stream as unknown as { write(t: string): void }).write(
      xform.headerFooter.toXml(this.headerFooter)
    );
  }

  _writeBackground() {
    if (this._background) {
      if (this._background.imageId !== undefined) {
        const image = (
          this._workbook as unknown as { getImage(id: number): { name: string } }
        ).getImage(this._background.imageId);
        const pictureId = this._sheetRelsWriter.addMedia({
          Target: `../media/${image.name}`,
          Type: RelType.Image,
        });

        this._background = {
          ...this._background,
          rId: pictureId,
        };
      }
      (this.stream as unknown as { write(t: string): void }).write(
        xform.picture.toXml({ rId: this._background.rId })
      );
    }
  }

  _writeLegacyData() {
    if (this.hasComments) {
      (this.stream as unknown as { write(t: string): void }).write(
        `<legacyDrawing r:id="${this._sheetCommentsWriter.vmlRelId}"/>`
      );
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
