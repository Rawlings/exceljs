import _ from '../utils/helpers/under-dash';
import * as Enums from './enums';
import colCache from '../utils/data/col-cache';
import { Cell, type Style, type CellValue, type CellModel, type CellValueModel } from './cell';
import { copyStyle } from '../utils/helpers/copy-style';
import type { WorksheetLike, RowLike, EachRowOptions } from './internal-types';

export type RowValues = CellValue[] | { [key: string]: CellValue } | undefined | null;

export interface RowModel {
  [key: string]: unknown;
  cells: (CellModel | CellValueModel)[];
  number: number;
  min: number;
  max: number;
  height: number | undefined;
  style: Partial<Style>;
  hidden: boolean;
  outlineLevel: number;
  collapsed: boolean;
}

export class Row implements RowLike {
  _worksheet: WorksheetLike;
  _number: number;
  _cells: (Cell | undefined)[];
  style: Partial<Style>;
  _hidden: boolean | undefined;
  _outlineLevel: number | undefined;
  _height: number | undefined;

  constructor(worksheet: WorksheetLike, number: number) {
    this._worksheet = worksheet;
    this._number = number;
    this._cells = [];
    this.style = {};
    this.outlineLevel = 0;
  }

  // return the row number
  get number() {
    return this._number;
  }

  get worksheet() {
    return this._worksheet;
  }

  // Inform Streaming Writer that this row (and all rows before it) are complete
  // and ready to write. Has no effect on Worksheet document
  commit() {
    this._worksheet._commitRow?.(this);
  }

  // helps GC by breaking cyclic references
  destroy() {
    this._cells = [];
    this.style = {};
  }

  findCell(colNumber: number): Cell | undefined {
    return this._cells[colNumber - 1];
  }

  // given {address, row, col}, find or create new cell
  getCellEx(address: { col: number; row: number; address: string }): Cell {
    let cell = this._cells[address.col - 1];
    if (!cell) {
      const column = this._worksheet.getColumn?.(address.col);
      cell = new Cell(this, column, address.address);
      this._cells[address.col - 1] = cell;
    }
    return cell;
  }

  // get cell by key, letter or column number
  getCell(col: number | string): Cell {
    if (typeof col === 'number') {
      let cell = this._cells[col - 1];
      if (!cell) {
        const column = this._worksheet.getColumn?.(col);
        const address = colCache.encodeAddress(this._number, col);
        cell = new Cell(this, column, address);
        this._cells[col - 1] = cell;
      }
      return cell;
    }

    if (typeof col === 'string') {
      const colOption = this._worksheet.getColumn?.(col);
      if (colOption && typeof colOption.number === 'number') {
        return this.getCell(colOption.number);
      }
      const address = colCache.decodeAddress(col);
      return this.getCell(address.col);
    }
    throw new Error(`Invalid column key/number: ${String(col)}`);
  }

  // remove cell(s) and shift all higher cells down by count
  splice(start: number, count: number, ...inserts: unknown[]) {
    const nKeep = start + count;
    const nExpand = inserts.length - count;
    const nEnd = this._cells.length;
    let i;
    let cSrc;
    let cDst;

    if (nExpand < 0) {
      // remove cells
      for (i = start + inserts.length; i <= nEnd; i++) {
        cDst = this._cells[i - 1];
        cSrc = this._cells[i - nExpand - 1];
        if (cSrc) {
          cDst = this.getCell(i);
          cDst.value = cSrc.value;
          cDst.style = cSrc.style;
          cDst.note = cSrc.note;
        } else if (cDst) {
          cDst.value = null;
          cDst.style = {};
          cDst.note = undefined;
        }
      }
      const actualDeleteCount = Math.min(count, Math.max(0, nEnd - start + 1));
      this._cells.length = nEnd - actualDeleteCount + inserts.length;
    } else if (nExpand > 0) {
      // insert new cells
      for (i = nEnd; i >= nKeep; i--) {
        cSrc = this._cells[i - 1];
        if (cSrc) {
          cDst = this.getCell(i + nExpand);
          cDst.value = cSrc.value;
          cDst.style = cSrc.style;
          cDst.note = cSrc.note;
        } else {
          this._cells[i + nExpand - 1] = undefined;
        }
      }
    }

    // handle insert values
    for (i = 0; i < inserts.length; i++) {
      cDst = this.getCell(start + i);
      cDst.value = inserts[i] as CellValue;
      cDst.style = {};
      cDst.note = undefined;
    }
  }

  // Iterate over all non-null cells in this row
  eachCell(callback: (cell: Cell, colNumber: number) => void): void;
  eachCell(options: EachRowOptions | null, callback: (cell: Cell, colNumber: number) => void): void;
  eachCell(
    options: EachRowOptions | null | ((cell: Cell, colNumber: number) => void),
    iteratee?: (cell: Cell, colNumber: number) => void,
  ) {
    let fn: (cell: Cell, colNumber: number) => void;
    let opt: EachRowOptions | null = null;
    if (typeof options === 'function') {
      fn = options;
    } else {
      opt = options;
      fn = iteratee ?? (() => {});
    }
    if (opt?.includeEmpty) {
      const n = this._cells.length;
      for (let i = 1; i <= n; i++) {
        fn(this.getCell(i), i);
      }
    } else {
      this._cells.forEach((cell, index) => {
        if (cell && cell.type !== Enums.ValueType.Null) {
          fn(cell, index + 1);
        }
      });
    }
  }

  // ===========================================================================
  // Page Breaks
  addPageBreak(lft?: number, rght?: number) {
    this._worksheet.rowBreaks ??= [];
    const left = Math.max(0, (lft ?? 0) - 1) || 0;
    const right = Math.max(0, (rght ?? 0) - 1) || 16838;
    const pb: Record<string, unknown> = {
      id: this._number,
      max: right,
      man: 1,
    };
    if (left) pb.min = left;

    this._worksheet.rowBreaks.push(pb);
  }

  get values() {
    const values: CellValue[] = [];
    this._cells.forEach((cell) => {
      if (cell && cell.type !== Enums.ValueType.Null) {
        values[cell.col] = cell.value;
      }
    });
    return values;
  }

  // set the values by contiguous or sparse array, or by key'd object literal
  set values(value: RowValues) {
    // this operation is not additive - any prior cells are removed
    this._cells = [];
    if (!value) {
      // empty row
    } else if (Array.isArray(value)) {
      let offset = 0;
      if (Object.prototype.hasOwnProperty.call(value, '0')) {
        // contiguous array - start at column 1
        offset = 1;
      }
      value.forEach((val, index) => {
        if (val !== undefined) {
          this.getCell(index + offset).value = val;
        }
      });
    } else {
      // object literal - { A: 1, B: 2 } or { 1: 1, 2: 2 }
      Object.keys(value).forEach((key) => {
        this.getCell(key).value = value[key];
      });
    }
  }

  get hasValues() {
    return this._cells.some((cell) => cell && cell.type !== Enums.ValueType.Null);
  }

  get cellCount() {
    return this._cells.length;
  }

  get actualCellCount() {
    let count = 0;
    this.eachCell(() => {
      count++;
    });
    return count;
  }

  // =========================================================================
  // Styles
  get font() {
    return this.style.font;
  }

  set font(value) {
    this.style.font = value;
    this._cells.forEach((cell) => {
      if (cell) cell.font = value;
    });
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value) {
    this.style.alignment = value;
    this._cells.forEach((cell) => {
      if (cell) cell.alignment = value;
    });
  }

  get border() {
    return this.style.border;
  }

  set border(value) {
    this.style.border = value;
    this._cells.forEach((cell) => {
      if (cell) cell.border = value;
    });
  }

  get fill() {
    return this.style.fill;
  }

  set fill(value) {
    this.style.fill = value;
    this._cells.forEach((cell) => {
      if (cell) cell.fill = value;
    });
  }

  get numFmt() {
    return this.style.numFmt;
  }

  set numFmt(value) {
    this.style.numFmt = value;
    this._cells.forEach((cell) => {
      if (cell) cell.numFmt = value;
    });
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value) {
    this.style.protection = value;
    this._cells.forEach((cell) => {
      if (cell) cell.protection = value;
    });
  }

  get hidden() {
    return !!this._hidden;
  }

  set hidden(value) {
    this._hidden = value;
  }

  get outlineLevel() {
    return this._outlineLevel ?? 0;
  }

  set outlineLevel(value) {
    this._outlineLevel = value;
  }

  get collapsed() {
    return !!(
      this._outlineLevel && this._outlineLevel >= (this._worksheet.properties?.outlineLevelRow ?? 0)
    );
  }

  // =========================================================================
  get height() {
    return this._height;
  }

  set height(value: number | undefined) {
    const isCustom = value !== undefined;
    if (this._worksheet.properties) {
      this._worksheet.properties.customRowHeight = isCustom;
    }
    this._height = value;
  }

  get min() {
    let min = 0;
    this._cells.forEach((cell) => {
      if (cell) {
        min = min ? Math.min(min, cell.col) : cell.col;
      }
    });
    return min;
  }

  get max() {
    let max = 0;
    this._cells.forEach((cell) => {
      if (cell) {
        max = Math.max(max, cell.col);
      }
    });
    return max;
  }

  get dimensions() {
    const { min, max } = this;
    return min && max ? { min, max } : null;
  }

  // =========================================================================
  // Model
  get model(): RowModel | null {
    const cells: (CellModel | CellValueModel)[] = [];
    let min = 0;
    let max = 0;
    this._cells.forEach((cell) => {
      if (cell) {
        const cellModel = cell.model;
        if (cellModel) {
          cells.push(cellModel);
          min = min ? Math.min(min, cell.col) : cell.col;
          max = Math.max(max, cell.col);
        }
      }
    });

    return cells.length
      ? {
          cells,
          number: this.number,
          min,
          max,
          height: this.height,
          style: this.style,
          hidden: this.hidden,
          outlineLevel: this.outlineLevel,
          collapsed: this.collapsed,
        }
      : null;
  }

  set model(value: RowModel | null) {
    if (!value) {
      this._cells = [];
      return;
    }
    this._cells = [];
    let previousAddress: { row: number; col: number; address: string } | undefined;
    value.cells.forEach((cellModel) => {
      if (cellModel.type === Cell.Types.Merge) {
        return;
      }
      let address: { row: number; col: number; address: string } | undefined;
      if (typeof cellModel.address === 'string') {
        address = colCache.decodeAddress(cellModel.address);
      } else if (
        cellModel.address &&
        typeof cellModel.address === 'object' &&
        'address' in cellModel.address
      ) {
        address = cellModel.address as { row: number; col: number; address: string };
      } else if (previousAddress) {
        const { row } = previousAddress;
        const col = previousAddress.col + 1;
        address = {
          row,
          col,
          address: colCache.encodeAddress(row, col),
        };
      }
      if (address) {
        previousAddress = address;
        const cell = this.getCellEx(address);
        cell.model = cellModel as CellModel;
      }
    });

    if (value.height) {
      this.height = value.height;
    } else {
      delete this.height;
    }

    this.hidden = value.hidden;
    this.outlineLevel = value.outlineLevel || 0;

    this.style = copyStyle(value.style);
  }
}

export default Row;
