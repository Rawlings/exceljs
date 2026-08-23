import _ from '../utils/helpers/under-dash';
import colCache from '../utils/data/col-cache';
import { Range } from './range';
import { Row, type RowModel, type RowValues } from './row';
import { Column, type ColumnModel, type ColumnDefinition } from './column';
import * as Enums from './enums';
import { WorksheetImage as Image } from './image';
import { Table } from './table';
import { DataValidations } from './data-validations';
import { makePivotTable } from './pivot-table';
import Encryptor from '../utils/crypto/encryptor';
import { copyStyle } from '../utils/helpers/copy-style';
import type { WorksheetLike, CellLike, WorkbookLike, EachRowOptions } from './internal-types';

import type { ImageRange, ImagePosition, ImageModel, ImageRangeInput, Media } from './image';
import type { TableProperties } from './table';
import type { PivotTableModel } from './pivot-table';
import type { ConditionalFormattingOptions } from './conditional-formatting';
import type { Cell, Color, CellValue, CellFormulaValue } from './cell';

export interface WorksheetViewCommon {
  rightToLeft: boolean;
  activeCell: string;
  showRuler: boolean;
  showRowColHeaders: boolean;
  showGridLines: boolean;
  zoomScale: number;
  zoomScaleNormal: number;
}

export interface WorksheetViewNormal {
  state: 'normal';
  style: 'pageBreakPreview' | 'pageLayout';
}

export interface WorksheetViewFrozen {
  state: 'frozen';
  style?: 'pageBreakPreview';
  xSplit?: number;
  ySplit?: number;
  topLeftCell?: string;
}

export interface WorksheetViewSplit {
  state: 'split';
  style?: 'pageBreakPreview' | 'pageLayout';
  xSplit?: number;
  ySplit?: number;
  topLeftCell?: string;
  activePane?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

export type WorksheetView = WorksheetViewCommon &
  (WorksheetViewNormal | WorksheetViewFrozen | WorksheetViewSplit);

export type { WorkbookView } from './workbook';

export interface Margins {
  top: number;
  left: number;
  bottom: number;
  right: number;
  header: number;
  footer: number;
}

export interface PageSetup {
  margins: Margins;
  orientation: 'portrait' | 'landscape';
  horizontalDpi: number;
  verticalDpi: number;
  fitToPage: boolean;
  fitToWidth: number;
  fitToHeight: number;
  scale: number;
  pageOrder: 'downThenOver' | 'overThenDown';
  blackAndWhite: boolean;
  draft: boolean;
  cellComments: 'atEnd' | 'asDisplayed' | 'None';
  errors: 'dash' | 'blank' | 'NA' | 'displayed';
  paperSize: number;
  showRowColHeaders: boolean;
  showGridLines: boolean;
  firstPageNumber: number;
  horizontalCentered: boolean;
  verticalCentered: boolean;
  printArea: string;
  printTitlesRow: string;
  printTitlesColumn: string;
}

export interface HeaderFooter {
  differentFirst: boolean;
  differentOddEven: boolean;
  oddHeader: string;
  oddFooter: string;
  evenHeader: string;
  evenFooter: string;
  firstHeader: string;
  firstFooter: string;
}

export interface WorksheetProperties {
  tabColor: Partial<Color>;
  outlineLevelCol: number;
  outlineLevelRow: number;
  outlineProperties: {
    summaryBelow: boolean;
    summaryRight: boolean;
  };
  defaultRowHeight: number;
  defaultColWidth?: number;
  dyDescent: number;
  showGridLines: boolean;
}

export interface WorksheetProtection {
  objects: boolean;
  scenarios: boolean;
  selectLockedCells: boolean;
  selectUnlockedCells: boolean;
  formatCells: boolean;
  formatColumns: boolean;
  formatRows: boolean;
  insertColumns: boolean;
  insertRows: boolean;
  insertHyperlinks: boolean;
  deleteColumns: boolean;
  deleteRows: boolean;
  sort: boolean;
  autoFilter: boolean;
  pivotTables: boolean;
  spinCount: number;
  sheet?: boolean;
  algorithmName?: string;
  saltValue?: string;
  hashValue?: string;
}

export type AutoFilter =
  | string
  | {
      from: string | { row: number; column: number };
      to: string | { row: number; column: number };
    };

export type WorksheetState = 'visible' | 'hidden' | 'veryHidden';

export interface RowBreak {
  id: number;
  max: number;
  min: number;
  man: number;
}

export interface WorksheetModel {
  id: number;
  name: string;
  dataValidations?: unknown;
  properties: WorksheetProperties;
  pageSetup: Partial<PageSetup>;
  headerFooter: Partial<HeaderFooter>;
  rowBreaks: RowBreak[];
  views: Array<Partial<WorksheetView>>;
  autoFilter: AutoFilter;
  media: Media[];
  merges: Range['range'][];
  state?: WorksheetState;
  cols?: ColumnModel[];
  rows?: RowModel[];
  dimensions?: Range;
  sheetProtection?: Partial<WorksheetProtection> | null;
  tables?: TableProperties[];
  pivotTables?: unknown[];
  conditionalFormattings?: unknown[];
}

export interface WorksheetOptions {
  workbook?: WorkbookLike;
  id?: number;
  orderNo?: number;
  name?: string;
  state?: WorksheetState;
  properties?: Partial<WorksheetProperties>;
  pageSetup?: Partial<PageSetup>;
  headerFooter?: Partial<HeaderFooter>;
  views?: Array<Partial<WorksheetView>>;
  autoFilter?: AutoFilter;
}

export interface AddWorksheetOptions {
  properties: Partial<WorksheetProperties>;
  pageSetup: Partial<PageSetup>;
  headerFooter: Partial<HeaderFooter>;
  views: Array<Partial<WorksheetView>>;
  state: WorksheetState;
}

export class Worksheet implements WorksheetLike {
  _workbook: WorkbookLike;
  id: number;
  orderNo: number | undefined;
  state: WorksheetState;
  _rows: (Row | undefined)[];
  _columns: Column[] | null;
  _keys: Record<string, Column | undefined>;
  _merges: Record<string, Range | undefined>;
  rowBreaks: RowBreak[];
  properties: WorksheetProperties;
  pageSetup: Partial<PageSetup>;
  headerFooter: Partial<HeaderFooter>;
  dataValidations: DataValidations;
  sheetProtection: Partial<WorksheetProtection> | null;
  tables: Record<string, Table>;
  pivotTables: unknown[];
  conditionalFormattings: unknown[];
  _name: string | undefined;
  _headerRowCount: number | undefined;
  views: Array<Partial<WorksheetView>>;
  autoFilter: AutoFilter | null | undefined;
  _media: Image[];
  sheetView: unknown;

  constructor(options?: WorksheetOptions) {
    const opts = options ?? {};
    this._workbook = opts.workbook ?? {};

    this.id = opts.id ?? 0;
    this.orderNo = opts.orderNo;
    this.name = opts.name || `sheet${this.id}`;
    this.state = opts.state ?? 'visible';

    this._rows = [];
    this._columns = null;
    this._keys = {};
    this._merges = {};
    this.rowBreaks = [];

    this.properties = {
      defaultRowHeight: 15,
      dyDescent: 55,
      outlineLevelCol: 0,
      outlineLevelRow: 0,
      showGridLines: true,
      outlineProperties: {
        summaryBelow: true,
        summaryRight: true,
      },
      tabColor: {},
      ...opts.properties,
    };

    this.pageSetup = {
      margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      orientation: 'portrait',
      horizontalDpi: 4294967295,
      verticalDpi: 4294967295,
      fitToPage: Boolean(
        opts.pageSetup &&
        (opts.pageSetup.fitToWidth ?? opts.pageSetup.fitToHeight) &&
        !opts.pageSetup.scale,
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
      ...opts.pageSetup,
    };

    this.headerFooter = {
      differentFirst: false,
      differentOddEven: false,
      oddHeader: undefined,
      oddFooter: undefined,
      evenHeader: undefined,
      evenFooter: undefined,
      firstHeader: undefined,
      firstFooter: undefined,
      ...opts.headerFooter,
    };

    this.dataValidations = new DataValidations();
    this.sheetProtection = null;
    this.tables = {};
    this.pivotTables = [];
    this.views = opts.views ?? [];
    this.autoFilter = opts.autoFilter;
    this._media = [];
    this.conditionalFormattings = [];
  }

  commit() {}

  get name(): string {
    return this._name ?? '';
  }

  set name(name: string) {
    if (typeof name !== 'string') {
      throw new Error('The name has to be a string.');
    }

    if (name === '') {
      throw new Error("The name can't be empty.");
    }

    if (this._name === name) return;

    if (name === 'History') {
      throw new Error('The name "History" is protected. Please use a different name.');
    }

    if (/[*?:/\\[\]]/.test(name)) {
      throw new Error(
        `Worksheet name ${name} cannot include any of the following characters: * ? : \\ / [ ]`,
      );
    }

    if (/(^')|('$)/.test(name)) {
      throw new Error(
        `The first or last character of worksheet name cannot be a single quotation mark: ${name}`,
      );
    }

    if (name.length > 31) {
      // eslint-disable-next-line no-console
      console.warn(`Worksheet name ${name} exceeds 31 chars. This will be truncated`);
      name = name.slice(0, 31);
    }

    const finalName = name;
    if (
      this._workbook._worksheets?.find(
        (ws) =>
          ws &&
          typeof ws === 'object' &&
          'name' in ws &&
          typeof ws.name === 'string' &&
          ws.name.toLowerCase() === finalName.toLowerCase(),
      )
    ) {
      throw new Error(`Worksheet name already exists: ${finalName}`);
    }

    this._name = name;
  }

  get workbook() {
    return this._workbook;
  }

  destroy() {
    this._workbook.removeWorksheetEx?.(this);
  }

  get dimensions() {
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

  get columns(): Column[] | null | undefined {
    return this._columns;
  }

  set columns(value: ColumnDefinition[]) {
    this._headerRowCount = value.reduce((pv: number, cv) => {
      const headerCount = cv.header ? 1 : 0;
      return Math.max(pv, headerCount);
    }, 0);

    let count = 1;
    const columns: Column[] = (this._columns = []);
    value.forEach((defn) => {
      const column = new Column(this, count++, false);
      columns.push(column);
      column.defn = defn;
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
    _.each(this._keys, (column: Column | undefined, key: string) => {
      if (column) {
        f(column, key);
      }
    });
  }

  getColumn(c: number | string): Column {
    if (typeof c === 'string') {
      const col = this._keys[c];
      if (col) return col;
      c = colCache.l2n(c);
    }
    this._columns ??= [];
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
      for (let i = 0; i < nRows; i++) {
        const row = this.getRow(i + 1);
        row.splice(start, count, ...inserts.map((insert) => insert[i] ?? null));
      }
    } else {
      this._rows.forEach((r) => {
        if (r) {
          r.splice(start, count);
        }
      });
    }

    const nExpand = inserts.length - count;
    const nKeep = start + count;
    const nEnd = this._columns ? this._columns.length : 0;
    if (nExpand < 0) {
      for (let i = start + inserts.length; i <= nEnd; i++) {
        this.getColumn(i).defn = this.getColumn(i - nExpand).defn;
      }
    } else if (nExpand > 0) {
      for (let i = nEnd; i >= nKeep; i--) {
        this.getColumn(i + nExpand).defn = this.getColumn(i).defn;
      }
    }
    for (let i = start; i < start + inserts.length; i++) {
      this.getColumn(i).defn = undefined;
    }

    this.workbook.definedNames?.spliceColumns?.(this.name, start, count, inserts.length);
  }

  get lastColumn() {
    return this.getColumn(this.columnCount);
  }

  get columnCount() {
    let maxCount = 0;
    this.eachRow((row) => {
      maxCount = Math.max(maxCount, row.cellCount);
    });
    return maxCount;
  }

  get actualColumnCount(): number {
    const counts = new Set<number>();
    this.eachRow((row) => {
      row.eachCell((cell) => {
        counts.add(cell.col);
      });
    });
    return counts.size;
  }

  // =========================================================================
  // Rows

  get _nextRow() {
    return this._rows.length + 1;
  }

  get _lastRowNumber() {
    return this._rows.length;
  }

  get _lastRow() {
    return this._rows.at(-1);
  }

  get lastRow() {
    if (this._rows.length) {
      return this.findRow(this._rows.length) ?? this.findRow(this._lastRowNumber);
    }
    return undefined;
  }

  findRow(r: number): Row | undefined {
    return this._rows[r - 1];
  }

  findRows(start: number, length: number): (Row | undefined)[] {
    return this._rows.slice(start - 1, start - 1 + length);
  }

  get rowCount() {
    return this._lastRowNumber;
  }

  get actualRowCount() {
    let count = 0;
    this.eachRow(() => {
      count++;
    });
    return count;
  }

  getRow(r: number): Row {
    let row = this._rows[r - 1];
    row ??= this._rows[r - 1] = new Row(this, r);
    return row;
  }

  getRows(start: number, length: number): Row[] | undefined {
    if (length < 1) return undefined;
    const rows: Row[] = [];
    for (let i = start; i < start + length; i++) {
      rows.push(this.getRow(i));
    }
    return rows;
  }

  addRow(value: RowValues, style: string = 'n'): Row {
    const rowNo = this._nextRow;
    const row = this.getRow(rowNo);
    row.values = value;
    this._setStyleOption(rowNo, style.startsWith('i') ? style : 'n');
    return row;
  }

  addRows(value: RowValues[], style: string = 'n'): Row[] {
    const rows: Row[] = [];
    value.forEach((row) => {
      rows.push(this.addRow(row, style));
    });
    return rows;
  }

  insertRow(pos: number, value: RowValues, style: string = 'n'): Row {
    this.spliceRows(pos, 0, value);
    this._setStyleOption(pos, style);
    return this.getRow(pos);
  }

  insertRows(pos: number, values: RowValues[], style: string = 'n'): Row[] | undefined {
    this.spliceRows(pos, 0, ...values);
    if (style !== 'n') {
      for (let i = 0; i < values.length; i++) {
        if (style.startsWith('o') && this.findRow(values.length + pos + i) !== undefined) {
          this._copyStyle(values.length + pos + i, pos + i, style[1] === '+');
        } else if (style.startsWith('i') && this.findRow(pos - 1) !== undefined) {
          this._copyStyle(pos - 1, pos + i, style[1] === '+');
        }
      }
    }
    return this.getRows(pos, values.length);
  }

  _setStyleOption(pos: number, style: string = 'n') {
    if (style.startsWith('o') && this.findRow(pos + 1) !== undefined) {
      this._copyStyle(pos + 1, pos, style[1] === '+');
    } else if (style.startsWith('i') && this.findRow(pos - 1) !== undefined) {
      this._copyStyle(pos - 1, pos, style[1] === '+');
    }
  }

  _copyStyle(src: number, dest: number, styleEmpty: boolean = false) {
    const rSrc = this.getRow(src);
    const rDst = this.getRow(dest);
    rDst.style = copyStyle(rSrc.style);
    rSrc.eachCell({ includeEmpty: styleEmpty }, (cell, colNumber) => {
      rDst.getCell(colNumber).style = copyStyle(cell.style);
    });
    rDst.height = rSrc.height;
  }

  duplicateRow(rowNum: number, count: number, insert: boolean = false) {
    const rSrc = this._rows[rowNum - 1];
    if (!rSrc) return;
    const inserts = Array.from({ length: count }, () => rSrc.values);
    this.spliceRows(rowNum + 1, insert ? 0 : count, ...inserts);

    for (let i = 0; i < count; i++) {
      const rDst = this._rows[rowNum + i];
      if (rDst) {
        rDst.style = rSrc.style;
        rDst.height = rSrc.height;
        rSrc.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rDst.getCell(colNumber).style = cell.style;
        });
      }
    }
  }

  spliceRows(start: number, count: number, ...inserts: RowValues[]) {
    const nKeep = start + count;
    const nInserts = inserts.length;
    const nExpand = nInserts - count;
    const nEnd = this._rows.length;
    let i;
    let rSrc: Row | undefined;
    if (nExpand < 0) {
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
          rSrc.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rDst.getCell(colNumber).style = cell.style;
          });
          this._rows[i - 1] = undefined;
        } else {
          this._rows[i + nExpand - 1] = undefined;
        }
      }
      const actualDeleteCount = Math.min(count, Math.max(0, nEnd - start + 1));
      this._rows.length = Math.max(0, nEnd - actualDeleteCount + nInserts);
    } else if (nExpand > 0) {
      for (i = nEnd; i >= nKeep; i--) {
        rSrc = this._rows[i - 1];
        if (rSrc) {
          const rDst = this.getRow(i + nExpand);
          rDst.values = rSrc.values;
          rDst.style = rSrc.style;
          rDst.height = rSrc.height;
          rSrc.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rDst.getCell(colNumber).style = cell.style;

            if (cell.type === Enums.ValueType.Merge) {
              const mergeMaster = cell.master;
              const cellToBeMerged = this.getRow(cell.row + nInserts).getCell(colNumber);
              const newMaster = this.getRow(mergeMaster.row + nInserts).getCell(mergeMaster.col);
              cellToBeMerged.merge(newMaster);
            }
          });
        } else {
          this._rows[i + nExpand - 1] = undefined;
        }
      }
    }

    for (i = 0; i < nInserts; i++) {
      const rDst = this.getRow(start + i);
      rDst.style = {};
      rDst.values = inserts[i];
    }

    this.workbook.definedNames?.spliceRows?.(this.name, start, count, nInserts);
  }

  eachRow(iteratee: (row: Row, rowNumber: number) => void): void;
  eachRow(
    options: EachRowOptions | null | undefined,
    iteratee: (row: Row, rowNumber: number) => void,
  ): void;
  eachRow(
    options: EachRowOptions | null | undefined | ((row: Row, rowNumber: number) => void),
    iteratee?: (row: Row, rowNumber: number) => void,
  ) {
    const callback = typeof options === 'function' ? options : iteratee;
    const eachOpts = typeof options === 'object' && options !== null ? options : undefined;
    if (callback) {
      if (eachOpts?.includeEmpty) {
        const n = this._rows.length;
        for (let i = 1; i <= n; i++) {
          callback(this.getRow(i), i);
        }
      } else {
        this._rows.forEach((row) => {
          if (row?.hasValues) {
            callback(row, row.number);
          }
        });
      }
    }
  }

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

  findCell(r: number | string, c?: number): Cell | undefined {
    const address = colCache.getAddress(r, c);
    const row = this._rows[address.row - 1];
    return row?.findCell(address.col);
  }

  getCell(r: number | string, c?: number): Cell {
    const address = colCache.getAddress(r, c);
    const row = this.getRow(address.row);
    return row.getCellEx(address);
  }

  // =========================================================================
  // Merge

  mergeCells(...cells: unknown[]) {
    const dimensions = new Range(cells);
    this._mergeCellsInternal(dimensions, undefined);
  }

  mergeCellsWithoutStyle(...cells: unknown[]) {
    const dimensions = new Range(cells);
    this._mergeCellsInternal(dimensions, true);
  }

  _mergeCellsInternal(dimensions: Range, ignoreStyle: boolean | undefined) {
    _.each(this._merges, (merge: Range | undefined) => {
      if (merge?.intersects(dimensions.model)) {
        throw new Error('Cannot merge already merged cells');
      }
    });

    const master = this.getCell(dimensions.top, dimensions.left);
    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        if (i > dimensions.top || j > dimensions.left) {
          this.getCell(i, j).merge(master, ignoreStyle);
        }
      }
    }

    this._merges[master.address] = dimensions;
  }

  _unMergeMaster(master: CellLike | undefined) {
    if (!master) return;
    const merge = this._merges[master.address];
    if (merge) {
      for (let i = merge.top; i <= merge.bottom; i++) {
        for (let j = merge.left; j <= merge.right; j++) {
          this.getCell(i, j).unmerge?.();
        }
      }
      delete this._merges[master.address];
    }
  }

  get hasMerges() {
    return _.some(this._merges, Boolean);
  }

  unMergeCells(...cells: unknown[]) {
    const dimensions = new Range(cells);

    for (let i = dimensions.top; i <= dimensions.bottom; i++) {
      for (let j = dimensions.left; j <= dimensions.right; j++) {
        const cell = this.findCell(i, j);
        if (cell) {
          if (cell.type === Enums.ValueType.Merge) {
            this._unMergeMaster(cell.master);
          } else if (this._merges[cell.address]) {
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
    results: unknown[] | unknown[][] | ((row: number, col: number) => unknown),
    shareType: string = 'shared',
  ) {
    const decoded = colCache.decode(range);
    const top = 'top' in decoded ? decoded.top : decoded.row;
    const left = 'top' in decoded ? decoded.left : decoded.col;
    const bottom = 'top' in decoded ? decoded.bottom : decoded.row;
    const right = 'top' in decoded ? decoded.right : decoded.col;
    const width = right - left + 1;
    const masterAddress = colCache.encodeAddress(top, left);
    const isShared = shareType === 'shared';

    let getResult: (row: number, col: number) => CellValue;
    if (typeof results === 'function') {
      getResult = results as (row: number, col: number) => CellValue;
    } else if (Array.isArray(results)) {
      getResult = (row: number, col: number) => {
        const rowItem = results[row - top];
        if (Array.isArray(rowItem)) {
          return rowItem[col - left] as CellValue;
        }
        return results[(row - top) * width + (col - left)] as CellValue;
      };
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
            result: getResult(r, c) as CellFormulaValue['result'],
          };
          first = false;
        } else {
          this.getCell(r, c).value = isShared
            ? {
                sharedFormula: masterAddress,
                result: getResult(r, c) as CellFormulaValue['result'],
              }
            : getResult(r, c);
        }
      }
    }
  }

  // =========================================================================
  // Images
  addImage(imageId: number, range: string | ImageRange | ImagePosition | ImageRangeInput) {
    const model: ImageModel = {
      type: 'image',
      imageId,
      range,
    };
    this._media.push(new Image(this, model));
  }

  getImages(): Image[] {
    return this._media.filter((m) => m.type === 'image');
  }

  addBackgroundImage(imageId: number) {
    const model: ImageModel = {
      type: 'background',
      imageId,
    };
    this._media.push(new Image(this, model));
  }

  getBackgroundImageId(): number | undefined {
    const image = this._media.find((m) => m.type === 'background');
    return image?.imageId;
  }

  // =========================================================================
  // Worksheet Protection
  protect(password: string | undefined, options: Record<string, unknown> | undefined) {
    return new Promise<void>((resolve) => {
      this.sheetProtection = {
        sheet: true,
      };
      if (options && 'spinCount' in options) {
        const spinCount =
          typeof options.spinCount === 'number' ? options.spinCount : Number(options.spinCount);
        options.spinCount = Number.isFinite(spinCount)
          ? Math.round(Math.max(0, spinCount))
          : 100000;
      }
      if (password) {
        const saltValue = Encryptor.randomBytes(16).toString('base64');
        const spinCount =
          options && 'spinCount' in options && typeof options.spinCount === 'number'
            ? options.spinCount
            : 100000;
        const hashValue = Encryptor.convertPasswordToHash(password, 'SHA512', saltValue, spinCount);
        this.sheetProtection = {
          ...this.sheetProtection,
          algorithmName: 'SHA-512',
          saltValue,
          spinCount,
          hashValue,
        };
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
  addTable(model: TableProperties): Table {
    const table = new Table(this, model);
    this.tables[model.name] = table;
    return table;
  }

  getTable(name: string): Table | undefined {
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
  addPivotTable(model: PivotTableModel) {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: Pivot Table support is experimental.
Please leave feedback at https://github.com/exceljs/exceljs/discussions/2575`,
    );

    const pivotTable = makePivotTable(this, model);

    this.pivotTables.push(pivotTable);
    this.workbook.pivotTables?.push(pivotTable);

    return pivotTable;
  }

  // ===========================================================================
  // Conditional Formatting
  addConditionalFormatting(cf: ConditionalFormattingOptions) {
    this.conditionalFormattings.push(cf);
  }

  removeConditionalFormatting(filter: number | ((cf: unknown) => boolean)) {
    if (typeof filter === 'number') {
      this.conditionalFormattings.splice(filter, 1);
    } else if (typeof filter === 'function') {
      this.conditionalFormattings = this.conditionalFormattings.filter(filter);
    } else {
      this.conditionalFormattings = [];
    }
  }

  // ===========================================================================
  // Deprecated
  get tabColor(): Partial<Color> | undefined {
    // eslint-disable-next-line no-console
    console.trace(
      'worksheet.tabColor property is now deprecated. Please use worksheet.properties.tabColor',
    );
    return this.properties.tabColor;
  }

  set tabColor(value: Partial<Color> | undefined) {
    // eslint-disable-next-line no-console
    console.trace(
      'worksheet.tabColor property is now deprecated. Please use worksheet.properties.tabColor',
    );
    this.properties.tabColor = value ?? {};
  }

  // ===========================================================================
  // Model

  get model(): WorksheetModel {
    const merges: string[] = [];
    Object.values(this._merges).forEach((merge) => {
      if (merge) {
        merges.push(merge.range);
      }
    });

    const model: WorksheetModel = {
      id: this.id,
      name: this.name,
      dataValidations: this.dataValidations.model,
      properties: this.properties,
      state: this.state,
      pageSetup: this.pageSetup,
      headerFooter: this.headerFooter,
      rowBreaks: this.rowBreaks,
      views: this.views,
      autoFilter: this.autoFilter ?? '',
      media: this._media.map((medium) => medium.model as unknown as Media),
      sheetProtection: this.sheetProtection,
      tables: Object.values(this.tables).map((table) => table.model),
      pivotTables: this.pivotTables,
      conditionalFormattings: this.conditionalFormattings,
      merges,
      cols: Column.toModel(this.columns ?? undefined),
    };

    const rows: RowModel[] = [];
    const dimensions = new Range();
    this._rows.forEach((row) => {
      const rowModel = row?.model;
      if (rowModel) {
        dimensions.expand(rowModel.number, rowModel.min, rowModel.number, rowModel.max);
        rows.push(rowModel);
      }
    });
    model.rows = rows;
    model.dimensions = dimensions;

    return model;
  }

  _parseRows(model: { rows?: RowModel[] }) {
    this._rows = [];
    if (Array.isArray(model.rows)) {
      model.rows.forEach((rowModel) => {
        const row = new Row(this, rowModel.number);
        this._rows[row.number - 1] = row;
        row.model = rowModel;
      });
    }
  }

  _parseMergeCells(model: { mergeCells?: string[] | Record<string, unknown> }) {
    if (Array.isArray(model.mergeCells)) {
      model.mergeCells.forEach((merge) => {
        this.mergeCellsWithoutStyle(merge);
      });
    } else if (model.mergeCells && typeof model.mergeCells === 'object') {
      Object.values(model.mergeCells).forEach((merge) => {
        this.mergeCellsWithoutStyle(merge);
      });
    }
  }

  set model(
    value: WorksheetModel & {
      cols?: ColumnModel[];
      mergeCells?: string[] | Record<string, unknown>;
    },
  ) {
    this.name = value.name;
    this._columns = Column.fromModel(this, value.cols);
    this._parseRows(value);

    this._parseMergeCells(value);
    this.dataValidations = new DataValidations(
      value.dataValidations as Record<string, unknown> | undefined,
    );
    this.properties = Object.assign(
      {
        defaultRowHeight: 15,
        dyDescent: 55,
        outlineLevelCol: 0,
        outlineLevelRow: 0,
        showGridLines: true,
        outlineProperties: {
          summaryBelow: true,
          summaryRight: true,
        },
        tabColor: {},
      },
      value.properties,
    );
    this.pageSetup = value.pageSetup;
    this.headerFooter = value.headerFooter;
    this.views = value.views;
    this.autoFilter = value.autoFilter;
    this._media = Array.isArray(value.media)
      ? value.media.map((medium) => new Image(this, medium as unknown as ImageModel))
      : [];
    this.sheetProtection = value.sheetProtection ?? null;
    this.tables = Array.isArray(value.tables)
      ? value.tables.reduce((tables: Record<string, Table>, table) => {
          const t = new Table(this, table);
          t.model = table;
          tables[table.name] = t;
          return tables;
        }, {})
      : {};
    this.pivotTables = value.pivotTables ?? [];
    this.conditionalFormattings = value.conditionalFormattings ?? [];
  }
}

export default Worksheet;
