import _ from '#src/utils/helpers/under-dash';
import colCache from '#src/utils/data/col-cache';
import Range from '#src/core/range';
import Row from '#src/core/row';
import Column from '#src/core/column';
import Enums from '#src/core/enums';
import Image from '#src/core/image';
import Table from '#src/core/table';
import DataValidations from '#src/core/data-validations';
import { makePivotTable } from '#src/core/pivot-table';
import Encryptor from '#src/utils/crypto/encryptor';
import { copyStyle } from '#src/utils/helpers/copy-style';
import type {
  WorksheetLike,
  ColumnLike,
  CellLike,
  WorkbookLike,
  EachRowOptions,
} from '#src/core/internal-types';

// Worksheet requirements
//  Operate as sheet inside workbook or standalone
//  Load and Save from file and stream
//  Access/Add/Delete individual cells
//  Manage column widths and row heights

export interface WorksheetOptions {
  workbook?: WorkbookLike;
  id?: number;
  orderNo?: number;
  name?: string;
  state?: string;
  properties?: Record<string, unknown>;
  pageSetup?: Record<string, unknown>;
  headerFooter?: Record<string, unknown>;
  views?: unknown[];
  autoFilter?: unknown;
}

class Worksheet implements WorksheetLike {
  _workbook: WorkbookLike;
  id: number;
  orderNo: number | undefined;
  state: string;
  _rows: (Row | undefined)[];
  _columns: Column[] | null;
  _keys: Record<string, Column>;
  _merges: Record<string, Range>;
  rowBreaks: unknown[];
  properties: Record<string, unknown> & { outlineLevelCol: number; outlineLevelRow: number };
  pageSetup: Record<string, unknown>;
  headerFooter: Record<string, unknown>;
  dataValidations: DataValidations;
  sheetProtection: Record<string, unknown> | null;
  tables: Record<string, Table>;
  pivotTables: unknown[];
  conditionalFormattings: unknown[];
  _name: string | undefined;
  _headerRowCount: number | undefined;
  views: unknown[];
  autoFilter: unknown;
  _media: Image[];
  sheetView: unknown;

  constructor(options?: WorksheetOptions) {
    options = options || {};
    this._workbook = options.workbook as WorkbookLike;

    // in a workbook, each sheet will have a number
    this.id = options.id as number;
    this.orderNo = options.orderNo;

    // and a name
    this.name = options.name as string;

    // add a state
    this.state = options.state || 'visible';

    // rows allows access organised by row. Sparse array of arrays indexed by row-1, col
    // Note: _rows is zero based. Must subtract 1 to go from cell.row to index
    this._rows = [];

    // column definitions
    this._columns = null;

    // column keys (addRow convenience): key ==> this._collumns index
    this._keys = {};

    // keep record of all merges
    this._merges = {};

    // record of all row and column pageBreaks
    this.rowBreaks = [];

    // for tabColor, default row height, outline levels, etc
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
        firstPageNumber: undefined,
        horizontalCentered: false,
        verticalCentered: false,
        rowBreaks: null,
        colBreaks: null,
      },
      options.pageSetup
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

    this.dataValidations = new DataValidations();

    // for freezepanes, split, zoom, gridlines, etc
    this.views = options.views || [];

    this.autoFilter = options.autoFilter || null;

    // for images, etc
    this._media = [];

    // worksheet protection
    this.sheetProtection = null;

    // for tables
    this.tables = {};

    this.pivotTables = [];

    this.conditionalFormattings = [];
  }

  get name(): string {
    return this._name as string;
  }

  set name(name: string) {
    if (name === undefined) {
      name = `sheet${this.id}`;
    }

    if (this._name === name) return;

    if (typeof name !== 'string') {
      throw new Error('The name has to be a string.');
    }

    if (name === '') {
      throw new Error("The name can't be empty.");
    }

    if (name === 'History') {
      throw new Error('The name "History" is protected. Please use a different name.');
    }

    // Illegal character in worksheet name: asterisk (*), question mark (?),
    // colon (:), forward slash (/ \), or bracket ([])
    if (/[*?:/\\[\]]/.test(name)) {
      throw new Error(
        `Worksheet name ${name} cannot include any of the following characters: * ? : \\ / [ ]`
      );
    }

    if (/(^')|('$)/.test(name)) {
      throw new Error(
        `The first or last character of worksheet name cannot be a single quotation mark: ${name}`
      );
    }

    if (name && name.length > 31) {
      // eslint-disable-next-line no-console
      console.warn(`Worksheet name ${name} exceeds 31 chars. This will be truncated`);
      name = name.substring(0, 31);
    }

    if (
      this._workbook._worksheets.find((ws) => ws && ws.name.toLowerCase() === name.toLowerCase())
    ) {
      throw new Error(`Worksheet name already exists: ${name}`);
    }

    this._name = name;
  }

  get workbook(): WorkbookLike {
    return this._workbook;
  }

  // when you're done with this worksheet, call this to remove from workbook
  destroy() {
    this._workbook.removeWorksheetEx(this);
  }

  // Get the bounding range of the cells in this worksheet
  get dimensions(): Range {
    const dimensions = new Range();
    this._rows.forEach((row) => {
      if (row) {
        const rowDims = row.dimensions;
        if (rowDims) {
          dimensions.expand(row.number, rowDims.min, row.number, rowDims.max);
        }
      }
    });
    return dimensions;
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
      const column = new Column(this, count++, false);
      columns.push(column);
      column.defn = defn as unknown as import('#src/core/column').ColumnDefinition;
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

  // get a single column by col number. If it doesn't exist, create it and any gaps before it
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
        this._columns.push(new Column(this, n++));
      }
    }
    return this._columns[c - 1];
  }

  spliceColumns(start: number, count: number, ...inserts: unknown[][]) {
    const rows = this._rows;
    const nRows = rows.length;
    if (inserts.length > 0) {
      // must iterate over all rows whether they exist yet or not
      for (let i = 0; i < nRows; i++) {
        const rowArguments: unknown[] = [start, count];
        // eslint-disable-next-line no-loop-func
        inserts.forEach((insert) => {
          rowArguments.push(insert[i] || null);
        });
        const row = this.getRow(i + 1);
        // eslint-disable-next-line prefer-spread
        (
          (row as unknown as { splice(...args: unknown[]): void }).splice as (
            ...args: unknown[]
          ) => void
        ).apply(row, rowArguments);
      }
    } else {
      // nothing to insert, so just splice all rows
      this._rows.forEach((r) => {
        if (r) {
          (r as unknown as { splice(start: number, count: number): void }).splice(start, count);
        }
      });
    }

    // splice column definitions
    const nExpand = inserts.length - count;
    const nKeep = start + count;
    const nEnd = (this._columns as ColumnLike[]).length;
    if (nExpand < 0) {
      for (let i = start + inserts.length; i <= nEnd; i++) {
        (this.getColumn(i) as unknown as { defn: unknown }).defn = (
          this.getColumn(i - nExpand) as unknown as { defn: unknown }
        ).defn;
      }
    } else if (nExpand > 0) {
      for (let i = nEnd; i >= nKeep; i--) {
        (this.getColumn(i + nExpand) as unknown as { defn: unknown }).defn = (
          this.getColumn(i) as unknown as { defn: unknown }
        ).defn;
      }
    }
    for (let i = start; i < start + inserts.length; i++) {
      (this.getColumn(i) as unknown as { defn: unknown }).defn = null;
    }

    // account for defined names
    this.workbook.definedNames.spliceColumns(this.name, start, count, inserts.length);
  }

  get lastColumn(): Column {
    return this.getColumn(this.columnCount);
  }

  get columnCount(): number {
    let maxCount = 0;
    this.eachRow((row) => {
      maxCount = Math.max(maxCount, row.cellCount);
    });
    return maxCount;
  }

  get actualColumnCount(): number {
    // performance nightmare - for each row, counts all the columns used
    const counts: boolean[] = [];
    let count = 0;
    this.eachRow((row) => {
      row.eachCell(({ col }: CellLike) => {
        if (!counts[col]) {
          counts[col] = true;
          count++;
        }
      });
    });
    return count;
  }

  // =========================================================================
  // Rows

  _commitRow() {
    // nop - allows streaming reader to fill a document
  }

  get _lastRowNumber(): number {
    // need to cope with results of splice
    const rows = this._rows;
    let n = rows.length;
    while (n > 0 && rows[n - 1] === undefined) {
      n--;
    }
    return n;
  }

  get _nextRow(): number {
    return this._lastRowNumber + 1;
  }

  get lastRow(): Row | undefined {
    if (this._rows.length) {
      return this._rows[this._rows.length - 1];
    }
    return undefined;
  }

  // find a row (if exists) by row number
  findRow(r: number): Row | undefined {
    return this._rows[r - 1];
  }

  // find multiple rows (if exists) by row number
  findRows(start: number, length: number): (Row | undefined)[] {
    return this._rows.slice(start - 1, start - 1 + length);
  }

  get rowCount(): number {
    return this._lastRowNumber;
  }

  get actualRowCount(): number {
    // counts actual rows that have actual data
    let count = 0;
    this.eachRow(() => {
      count++;
    });
    return count;
  }

  // get a row by row number.
  getRow(r: number): Row {
    let row = this._rows[r - 1];
    if (!row) {
      row = this._rows[r - 1] = new Row(this, r);
    }
    return row;
  }

  // get multiple rows by row number.
  getRows(start: number, length: number): Row[] | undefined {
    if (length < 1) return undefined;
    const rows: Row[] = [];
    for (let i = start; i < start + length; i++) {
      rows.push(this.getRow(i));
    }
    return rows;
  }

  addRow(value: unknown, style: string = 'n'): Row {
    const rowNo = this._nextRow;
    const row = this.getRow(rowNo);
    row.values = value as unknown[] | Record<string, unknown> | undefined | null;
    this._setStyleOption(rowNo, style[0] === 'i' ? style : 'n');
    return row;
  }

  addRows(value: unknown[], style: string = 'n'): Row[] {
    const rows: Row[] = [];
    value.forEach((row) => {
      rows.push(this.addRow(row, style));
    });
    return rows;
  }

  insertRow(pos: number, value: unknown, style: string = 'n'): Row {
    this.spliceRows(pos, 0, value);
    this._setStyleOption(pos, style);
    return this.getRow(pos);
  }

  insertRows(pos: number, values: unknown[], style: string = 'n'): Row[] | undefined {
    this.spliceRows(pos, 0, ...values);
    if (style !== 'n') {
      // copy over the styles
      for (let i = 0; i < values.length; i++) {
        if (style[0] === 'o' && this.findRow(values.length + pos + i) !== undefined) {
          this._copyStyle(values.length + pos + i, pos + i, style[1] === '+');
        } else if (style[0] === 'i' && this.findRow(pos - 1) !== undefined) {
          this._copyStyle(pos - 1, pos + i, style[1] === '+');
        }
      }
    }
    return this.getRows(pos, values.length);
  }

  // set row at position to same style as of either pervious row (option 'i') or next row (option 'o')
  _setStyleOption(pos: number, style: string = 'n') {
    if (style[0] === 'o' && this.findRow(pos + 1) !== undefined) {
      this._copyStyle(pos + 1, pos, style[1] === '+');
    } else if (style[0] === 'i' && this.findRow(pos - 1) !== undefined) {
      this._copyStyle(pos - 1, pos, style[1] === '+');
    }
  }

  _copyStyle(src: number, dest: number, styleEmpty: boolean = false) {
    const rSrc = this.getRow(src);
    const rDst = this.getRow(dest);
    rDst.style = copyStyle(rSrc.style) as Record<string, unknown>;
    // eslint-disable-next-line no-loop-func
    rSrc.eachCell({ includeEmpty: styleEmpty }, (cell, colNumber) => {
      rDst.getCell(colNumber).style = copyStyle(cell.style) as Record<string, unknown>;
    });
    rDst.height = rSrc.height;
  }

  duplicateRow(rowNum: number, count: number, insert: boolean = false) {
    // create count duplicates of rowNum
    // either inserting new or overwriting existing rows

    const rSrc = this._rows[rowNum - 1] as Row;
    const inserts = Array.from({ length: count }, () => rSrc.values);
    this.spliceRows(rowNum + 1, insert ? 0 : count, ...inserts);

    // now copy styles...
    for (let i = 0; i < count; i++) {
      const rDst = this._rows[rowNum + i] as Row;
      rDst.style = rSrc.style;
      rDst.height = rSrc.height;
      // eslint-disable-next-line no-loop-func
      rSrc.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rDst.getCell(colNumber).style = cell.style;
      });
    }
  }

  spliceRows(start: number, count: number, ...inserts: unknown[]) {
    // same problem as row.splice, except worse.
    const nKeep = start + count;
    const nInserts = inserts.length;
    const nExpand = nInserts - count;
    const nEnd = this._rows.length;
    let i;
    let rSrc: Row | undefined;
    if (nExpand < 0) {
      // remove rows
      if (start === nEnd) {
        this._rows[nEnd - 1] = undefined;
      }
      for (i = nKeep; i <= nEnd; i++) {
        rSrc = this._rows[i - 1];
        if (rSrc) {
          const rDst = this.getRow(i + nExpand);
          rDst.values = rSrc.values;
          rDst.style = rSrc.style;
          rDst.height = rSrc.height;
          // eslint-disable-next-line no-loop-func
          rSrc.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rDst.getCell(colNumber).style = cell.style;
          });
          this._rows[i - 1] = undefined;
        } else {
          this._rows[i + nExpand - 1] = undefined;
        }
      }
    } else if (nExpand > 0) {
      // insert new cells
      for (i = nEnd; i >= nKeep; i--) {
        rSrc = this._rows[i - 1];
        if (rSrc) {
          const rDst = this.getRow(i + nExpand);
          rDst.values = rSrc.values;
          rDst.style = rSrc.style;
          rDst.height = rSrc.height;
          // eslint-disable-next-line no-loop-func
          rSrc.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rDst.getCell(colNumber).style = cell.style;

            // remerge cells accounting for insert offset
            const cellAny = cell as unknown as {
              _value: { constructor: { name: string }; _master: unknown };
              _row: { _number: number };
              _column: { _number: number };
              merge(master: CellLike): void;
            };
            if (cellAny._value.constructor.name === 'MergeValue') {
              const cellToBeMerged = this.getRow(cellAny._row._number + nInserts).getCell(
                colNumber
              ) as unknown as CellLike;
              const prevMaster = cellAny._value._master as {
                _row: { _number: number };
                _column: { _number: number };
              };
              const newMaster = this.getRow(prevMaster._row._number + nInserts).getCell(
                prevMaster._column._number
              );
              (cellToBeMerged as unknown as { merge(m: unknown): void }).merge(newMaster);
            }
          });
        } else {
          this._rows[i + nExpand - 1] = undefined;
        }
      }
    }

    // now copy over the new values
    for (i = 0; i < nInserts; i++) {
      const rDst = this.getRow(start + i);
      rDst.style = {};
      rDst.values = inserts[i] as unknown[] | Record<string, unknown> | undefined | null;
    }

    // account for defined names
    this.workbook.definedNames.spliceRows(this.name, start, count, nInserts);
  }

  // iterate over every row in the worksheet, including maybe empty rows
  eachRow(iteratee: (row: Row, rowNumber: number) => void): void;
  eachRow(
    options: EachRowOptions | null | undefined,
    iteratee: (row: Row, rowNumber: number) => void
  ): void;
  eachRow(
    options: EachRowOptions | null | undefined | ((row: Row, rowNumber: number) => void),
    iteratee?: (row: Row, rowNumber: number) => void
  ) {
    if (!iteratee) {
      iteratee = options as (row: Row, rowNumber: number) => void;
      options = undefined;
    }
    if (options && (options as EachRowOptions).includeEmpty) {
      const n = this._rows.length;
      for (let i = 1; i <= n; i++) {
        iteratee(this.getRow(i), i);
      }
    } else {
      this._rows.forEach((row) => {
        if (row && row.hasValues) {
          (iteratee as (row: Row, rowNumber: number) => void)(row, row.number);
        }
      });
    }
  }

  // return all rows as sparse array
  getSheetValues(): unknown[] {
    const rows: unknown[] = [];
    this._rows.forEach((row) => {
      if (row) {
        rows[row.number] = row.values;
      }
    });
    return rows;
  }

  // =========================================================================
  // Cells

  // returns the cell at [r,c] or address given by r. If not found, return undefined
  findCell(r: number | string, c?: number): CellLike | undefined {
    const address = colCache.getAddress(r, c);
    const row = this._rows[address.row - 1];
    return row ? row.findCell(address.col) : undefined;
  }

  // return the cell at [r,c] or address given by r. If not found, create a new one.
  getCell(r: number | string, c?: number): CellLike {
    const address = colCache.getAddress(r, c);
    const row = this.getRow(address.row);
    return row.getCellEx(address);
  }

  // =========================================================================
  // Merge

  // convert the range defined by ['tl:br'], [tl,br] or [t,l,b,r] into a single 'merged' cell
  mergeCells(...cells: unknown[]) {
    const dimensions = new Range(cells);
    this._mergeCellsInternal(dimensions, undefined);
  }

  mergeCellsWithoutStyle(...cells: unknown[]) {
    const dimensions = new Range(cells);
    this._mergeCellsInternal(dimensions, true);
  }

  _mergeCellsInternal(dimensions: Range, ignoreStyle: boolean | undefined) {
    // check cells aren't already merged
    _.each(this._merges, (merge: Range) => {
      if (merge.intersects(dimensions.model)) {
        throw new Error('Cannot merge already merged cells');
      }
    });

    // apply merge
    const master = this.getCell(dimensions.top, dimensions.left);
    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        // merge all but the master cell
        if (i > dimensions.top || j > dimensions.left) {
          (
            this.getCell(i, j) as unknown as { merge(m: unknown, ignoreStyle?: boolean): void }
          ).merge(master, ignoreStyle);
        }
      }
    }

    // index merge
    this._merges[master.address] = dimensions;
  }

  _unMergeMaster(master: CellLike) {
    // master is always top left of a rectangle
    const merge = this._merges[master.address];
    if (merge) {
      for (let i = merge.top; i <= merge.bottom; i++) {
        for (let j = merge.left; j <= merge.right; j++) {
          (this.getCell(i, j) as unknown as { unmerge(): void }).unmerge();
        }
      }
      delete this._merges[master.address];
    }
  }

  get hasMerges(): boolean {
    // return true if this._merges has a merge object
    return _.some(this._merges, Boolean);
  }

  // scan the range defined by ['tl:br'], [tl,br] or [t,l,b,r] and if any cell is part of a merge,
  // un-merge the group. Note this function can affect multiple merges and merge-blocks are
  // atomic - either they're all merged or all un-merged.
  unMergeCells(...cells: unknown[]) {
    const dimensions = new Range(cells);

    // find any cells in that range and unmerge them
    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        const cell = this.findCell(i, j);
        if (cell) {
          if (cell.type === Enums.ValueType.Merge) {
            // this cell merges to another master
            this._unMergeMaster((cell as unknown as { master: CellLike }).master);
          } else if (this._merges[cell.address]) {
            // this cell is a master
            this._unMergeMaster(cell);
          }
        }
      }
    }
  }

  // ===========================================================================
  // Shared/Array Formula
  fillFormula(
    range: string,
    formula: string,
    results: unknown[] | ((row: number, col: number) => unknown),
    shareType: string = 'shared'
  ) {
    // Define formula for top-left cell and share to rest
    const decoded = colCache.decode(range) as {
      top: number;
      left: number;
      bottom: number;
      right: number;
    };
    const { top, left, bottom, right } = decoded;
    const width = right - left + 1;
    const masterAddress = colCache.encodeAddress(top, left);
    const isShared = shareType === 'shared';

    // work out result accessor
    let getResult: (row: number, col: number) => unknown;
    if (typeof results === 'function') {
      getResult = results;
    } else if (Array.isArray(results)) {
      if (Array.isArray(results[0])) {
        getResult = (row: number, col: number) => (results as unknown[][])[row - top][col - left];
      } else {
        // eslint-disable-next-line no-mixed-operators
        getResult = (row: number, col: number) => results[(row - top) * width + (col - left)];
      }
    } else {
      getResult = () => undefined;
    }
    let first = true;
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (first) {
          this.getCell(r, c).value = {
            shareType,
            formula,
            ref: range,
            result: getResult(r, c),
          };
          first = false;
        } else {
          this.getCell(r, c).value = isShared
            ? {
                sharedFormula: masterAddress,
                result: getResult(r, c),
              }
            : getResult(r, c);
        }
      }
    }
  }

  // =========================================================================
  // Images
  addImage(imageId: number, range: unknown) {
    const model: import('#src/core/image').ImageModel = {
      type: 'image',
      imageId,
      range: range as import('#src/core/image').ImageRangeInput | string,
    };
    this._media.push(new Image(this, model));
  }

  getImages(): Image[] {
    return this._media.filter((m) => (m as unknown as { type: string }).type === 'image');
  }

  addBackgroundImage(imageId: number) {
    const model: import('#src/core/image').ImageModel = {
      type: 'background',
      imageId,
    };
    this._media.push(new Image(this, model));
  }

  getBackgroundImageId(): number | undefined {
    const image = this._media.find((m) => (m as unknown as { type: string }).type === 'background');
    return image && (image as unknown as { imageId: number }).imageId;
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

  // =========================================================================
  // Tables
  addTable(model: import('#src/core/table').TableModel): Table {
    const table = new Table(this, model);
    this.tables[model.name] = table;
    return table;
  }

  getTable(name: string): Table {
    return this.tables[name];
  }

  removeTable(name: string) {
    delete this.tables[name];
  }

  getTables(): Table[] {
    return Object.values(this.tables);
  }

  // =========================================================================
  // Pivot Tables
  addPivotTable(model: import('#src/core/pivot-table').PivotTableModel) {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: Pivot Table support is experimental.
Please leave feedback at https://github.com/exceljs/exceljs/discussions/2575`
    );

    const pivotTable = makePivotTable(this, model);

    this.pivotTables.push(pivotTable);
    this.workbook.pivotTables.push(pivotTable);

    return pivotTable;
  }

  // ===========================================================================
  // Conditional Formatting
  addConditionalFormatting(cf: unknown) {
    this.conditionalFormattings.push(cf);
  }

  removeConditionalFormatting(filter: number | ((cf: unknown) => boolean)) {
    if (typeof filter === 'number') {
      this.conditionalFormattings.splice(filter, 1);
    } else if (filter instanceof Function) {
      this.conditionalFormattings = this.conditionalFormattings.filter(filter);
    } else {
      this.conditionalFormattings = [];
    }
  }

  // ===========================================================================
  // Deprecated
  get tabColor(): unknown {
    // eslint-disable-next-line no-console
    console.trace(
      'worksheet.tabColor property is now deprecated. Please use worksheet.properties.tabColor'
    );
    return this.properties.tabColor;
  }

  set tabColor(value: unknown) {
    // eslint-disable-next-line no-console
    console.trace(
      'worksheet.tabColor property is now deprecated. Please use worksheet.properties.tabColor'
    );
    this.properties.tabColor = value;
  }

  // ===========================================================================
  // Model

  get model(): Record<string, unknown> {
    const model: Record<string, unknown> = {
      id: this.id,
      name: this.name,
      dataValidations: this.dataValidations.model,
      properties: this.properties,
      state: this.state,
      pageSetup: this.pageSetup,
      headerFooter: this.headerFooter,
      rowBreaks: this.rowBreaks,
      views: this.views,
      autoFilter: this.autoFilter,
      media: this._media.map((medium) => (medium as unknown as { model: unknown }).model),
      sheetProtection: this.sheetProtection,
      tables: Object.values(this.tables).map(
        (table) => (table as unknown as { model: unknown }).model
      ),
      pivotTables: this.pivotTables,
      conditionalFormattings: this.conditionalFormattings,
    };

    // =================================================
    // columns
    model.cols = Column.toModel(this.columns as Column[]);

    // ==========================================================
    // Rows
    const rows: unknown[] = (model.rows = []);
    const dimensions = (model.dimensions = new Range());
    this._rows.forEach((row) => {
      const rowModel =
        row &&
        (row as unknown as { model: { number: number; min: number; max: number } | null }).model;
      if (rowModel) {
        (dimensions as Range).expand(rowModel.number, rowModel.min, rowModel.number, rowModel.max);
        (rows as unknown[]).push(rowModel);
      }
    });

    // ==========================================================
    // Merges
    model.merges = [];
    _.each(this._merges, (merge: Range) => {
      (model.merges as unknown[]).push(merge.range);
    });

    return model;
  }

  _parseRows(model: { rows: { number: number }[] }) {
    this._rows = [];
    model.rows.forEach((rowModel) => {
      const row = new Row(this, rowModel.number);
      this._rows[row.number - 1] = row;
      (row as unknown as { model: unknown }).model = rowModel;
    });
  }

  _parseMergeCells(model: { mergeCells?: unknown[] | Record<string, unknown> }) {
    _.each(model.mergeCells as unknown[], (merge) => {
      // Do not merge styles when importing an Excel file
      // since each cell may have different styles intentionally.
      this.mergeCellsWithoutStyle(merge);
    });
  }

  set model(value: {
    name: string;
    cols?: unknown;
    rows: { number: number }[];
    mergeCells?: unknown;
    dataValidations?: Record<string, unknown>;
    properties: Record<string, unknown>;
    pageSetup: Record<string, unknown>;
    headerFooter: Record<string, unknown>;
    views: unknown[];
    autoFilter: unknown;
    media: unknown[];
    sheetProtection: Record<string, unknown> | null;
    tables: import('#src/core/table').TableModel[];
    pivotTables: unknown[];
    conditionalFormattings: unknown[];
  }) {
    this.name = value.name;
    this._columns = Column.fromModel(
      this,
      value.cols as Array<Record<string, unknown> & { min: number; max: number }>
    );
    this._parseRows(value);

    this._parseMergeCells(value as { mergeCells?: unknown[] | Record<string, unknown> });
    this.dataValidations = new DataValidations(value.dataValidations as never);
    this.properties = value.properties as Record<string, unknown> & {
      outlineLevelCol: number;
      outlineLevelRow: number;
    };
    this.pageSetup = value.pageSetup;
    this.headerFooter = value.headerFooter;
    this.views = value.views;
    this.autoFilter = value.autoFilter;
    this._media = value.media.map(
      (medium) => new Image(this, medium as import('#src/core/image').ImageModel)
    );
    this.sheetProtection = value.sheetProtection;
    this.tables = value.tables.reduce((tables: Record<string, Table>, table) => {
      const t = new Table(this, table);
      t.model = table;
      tables[table.name] = t;
      return tables;
    }, {});
    this.pivotTables = value.pivotTables;
    this.conditionalFormattings = value.conditionalFormattings;
  }
}

export default Worksheet;
