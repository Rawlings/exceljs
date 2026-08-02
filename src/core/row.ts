import _ from '../utils/helpers/under-dash';
import Enums from './enums';
import colCache from '../utils/data/col-cache';
import Cell from './cell';
import type { WorksheetLike, RowLike, CellLike, EachRowOptions } from './internal-types';

export interface RowModel {
  cells: Record<string, unknown>[];
  number: number;
  min: number;
  max: number;
  height: number | undefined;
  style: Record<string, unknown>;
  hidden: boolean;
  outlineLevel: number;
  collapsed: boolean;
}

class Row implements RowLike {
  _worksheet: WorksheetLike;
  _number: number;
  _cells: (CellLike | undefined)[];
  style: Record<string, unknown>;
  _hidden: boolean | undefined;
  _outlineLevel: number | undefined;
  height: number | undefined;

  constructor(worksheet: WorksheetLike, number: number) {
    this._worksheet = worksheet;
    this._number = number;
    this._cells = [];
    this.style = {};
    this.outlineLevel = 0;
  }

  // return the row number
  get number(): number {
    return this._number;
  }

  get worksheet(): WorksheetLike {
    return this._worksheet;
  }

  // Inform Streaming Writer that this row (and all rows before it) are complete
  // and ready to write. Has no effect on Worksheet document
  commit() {
    (this._worksheet as unknown as { _commitRow(row: Row): void })._commitRow(this); // eslint-disable-line no-underscore-dangle
  }

  // helps GC by breaking cyclic references
  destroy() {
    const self = this as unknown as Record<string, unknown>;
    delete self._worksheet;
    delete self._cells;
    delete self.style;
  }

  findCell(colNumber: number): CellLike | undefined {
    return this._cells[colNumber - 1];
  }

  // given {address, row, col}, find or create new cell
  getCellEx(address: { col: number; row: number; address: string }): CellLike {
    let cell = this._cells[address.col - 1];
    if (!cell) {
      const column = this._worksheet.getColumn(address.col);
      cell = new Cell(this, column, address.address) as unknown as CellLike;
      this._cells[address.col - 1] = cell;
    }
    return cell;
  }

  // get cell by key, letter or column number
  getCell(col: number | string): CellLike {
    if (typeof col === 'string') {
      // is it a key?
      const column = this._worksheet.getColumnKey(col);
      if (column) {
        col = column.number;
      } else {
        col = colCache.l2n(col);
      }
    }
    return (
      this._cells[col - 1] ||
      this.getCellEx({
        address: colCache.encodeAddress(this._number, col),
        row: this._number,
        col,
      })
    );
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
          // eslint-disable-next-line no-underscore-dangle
          cDst._comment = cSrc._comment;
        } else if (cDst) {
          cDst.value = null;
          cDst.style = {};
          // eslint-disable-next-line no-underscore-dangle
          cDst._comment = undefined;
        }
      }
    } else if (nExpand > 0) {
      // insert new cells
      for (i = nEnd; i >= nKeep; i--) {
        cSrc = this._cells[i - 1];
        if (cSrc) {
          cDst = this.getCell(i + nExpand);
          cDst.value = cSrc.value;
          cDst.style = cSrc.style;
          // eslint-disable-next-line no-underscore-dangle
          cDst._comment = cSrc._comment;
        } else {
          this._cells[i + nExpand - 1] = undefined;
        }
      }
    }

    // now add the new values
    for (i = 0; i < inserts.length; i++) {
      cDst = this.getCell(start + i);
      cDst.value = inserts[i];
      cDst.style = {};
      // eslint-disable-next-line no-underscore-dangle
      cDst._comment = undefined;
    }
  }

  // Iterate over all non-null cells in this row
  eachCell(iteratee: (cell: CellLike, colNumber: number) => void): void;
  eachCell(
    options: EachRowOptions | null,
    iteratee: (cell: CellLike, colNumber: number) => void
  ): void;
  eachCell(
    options: EachRowOptions | null | ((cell: CellLike, colNumber: number) => void),
    iteratee?: (cell: CellLike, colNumber: number) => void
  ) {
    if (!iteratee) {
      iteratee = options as (cell: CellLike, colNumber: number) => void;
      options = null;
    }
    if (options && (options as EachRowOptions).includeEmpty) {
      const n = this._cells.length;
      for (let i = 1; i <= n; i++) {
        iteratee(this.getCell(i), i);
      }
    } else {
      this._cells.forEach((cell, index) => {
        if (cell && cell.type !== Enums.ValueType.Null) {
          (iteratee as (cell: CellLike, colNumber: number) => void)(cell, index + 1);
        }
      });
    }
  }

  // ===========================================================================
  // Page Breaks
  addPageBreak(lft?: number, rght?: number) {
    const ws = this._worksheet as unknown as { rowBreaks: unknown[] };
    const left = Math.max(0, (lft as number) - 1) || 0;
    const right = Math.max(0, (rght as number) - 1) || 16838;
    const pb: Record<string, unknown> = {
      id: this._number,
      max: right,
      man: 1,
    };
    if (left) pb.min = left;

    ws.rowBreaks.push(pb);
  }

  // return a sparse array of cell values
  get values(): unknown[] {
    const values: unknown[] = [];
    this._cells.forEach((cell) => {
      if (cell && cell.type !== Enums.ValueType.Null) {
        values[cell.col] = cell.value;
      }
    });
    return values;
  }

  // set the values by contiguous or sparse array, or by key'd object literal
  set values(value: unknown[] | Record<string, unknown> | undefined | null) {
    // this operation is not additive - any prior cells are removed
    this._cells = [];
    if (!value) {
      // empty row
    } else if (value instanceof Array) {
      let offset = 0;
      if (Object.prototype.hasOwnProperty.call(value, '0')) {
        // contiguous array - start at column 1
        offset = 1;
      }
      value.forEach((item, index) => {
        if (item !== undefined) {
          this.getCellEx({
            address: colCache.encodeAddress(this._number, index + offset),
            row: this._number,
            col: index + offset,
          }).value = item;
        }
      });
    } else {
      // assume object with column keys
      this._worksheet.eachColumnKey((column, key) => {
        if ((value as Record<string, unknown>)[key] !== undefined) {
          this.getCellEx({
            address: colCache.encodeAddress(this._number, column.number),
            row: this._number,
            col: column.number,
          }).value = (value as Record<string, unknown>)[key];
        }
      });
    }
  }

  // returns true if the row includes at least one cell with a value
  get hasValues(): boolean {
    return _.some(
      this._cells,
      (cell: CellLike | undefined) => !!cell && cell.type !== Enums.ValueType.Null
    );
  }

  get cellCount(): number {
    return this._cells.length;
  }

  get actualCellCount(): number {
    let count = 0;
    this.eachCell(() => {
      count++;
    });
    return count;
  }

  // get the min and max column number for the non-null cells in this row or null
  get dimensions(): { min: number; max: number } | null {
    let min = 0;
    let max = 0;
    this._cells.forEach((cell) => {
      if (cell && cell.type !== Enums.ValueType.Null) {
        if (!min || min > cell.col) {
          min = cell.col;
        }
        if (max < cell.col) {
          max = cell.col;
        }
      }
    });
    return min > 0
      ? {
          min,
          max,
        }
      : null;
  }

  // =========================================================================
  // styles
  _applyStyle(name: string, value: unknown) {
    (this.style as Record<string, unknown>)[name] = value;
    this._cells.forEach((cell) => {
      if (cell) {
        (cell as unknown as Record<string, unknown>)[name] = value;
      }
    });
    return value;
  }

  get numFmt(): unknown {
    return this.style.numFmt;
  }

  set numFmt(value: unknown) {
    this._applyStyle('numFmt', value);
  }

  get font(): unknown {
    return this.style.font;
  }

  set font(value: unknown) {
    this._applyStyle('font', value);
  }

  get alignment(): unknown {
    return this.style.alignment;
  }

  set alignment(value: unknown) {
    this._applyStyle('alignment', value);
  }

  get protection(): unknown {
    return this.style.protection;
  }

  set protection(value: unknown) {
    this._applyStyle('protection', value);
  }

  get border(): unknown {
    return this.style.border;
  }

  set border(value: unknown) {
    this._applyStyle('border', value);
  }

  get fill(): unknown {
    return this.style.fill;
  }

  set fill(value: unknown) {
    this._applyStyle('fill', value);
  }

  get hidden(): boolean {
    return !!this._hidden;
  }

  set hidden(value: boolean) {
    this._hidden = value;
  }

  get outlineLevel(): number {
    return this._outlineLevel || 0;
  }

  set outlineLevel(value: number) {
    this._outlineLevel = value;
  }

  get collapsed(): boolean {
    return !!(
      this._outlineLevel && this._outlineLevel >= this._worksheet.properties.outlineLevelRow
    );
  }

  // =========================================================================
  get model(): RowModel | null {
    const cells: Record<string, unknown>[] = [];
    let min = 0;
    let max = 0;
    this._cells.forEach((cell) => {
      if (cell) {
        const cellModel = (cell as unknown as { model: Record<string, unknown> }).model;
        if (cellModel) {
          if (!min || min > cell.col) {
            min = cell.col;
          }
          if (max < cell.col) {
            max = cell.col;
          }
          cells.push(cellModel);
        }
      }
    });

    return this.height || cells.length
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

  set model(value: RowModel) {
    if (value.number !== this._number) {
      throw new Error('Invalid row number in model');
    }
    this._cells = [];
    let previousAddress: { row: number; col: number; address: string } | undefined;
    value.cells.forEach((cellModel: Record<string, unknown>) => {
      switch (cellModel.type) {
        case (Cell as unknown as { Types: Record<string, unknown> }).Types.Merge:
          // special case - don't add this types
          break;
        default: {
          let address: { row: number; col: number; address: string } | undefined;
          if (cellModel.address) {
            address = colCache.decodeAddress(cellModel.address as string);
          } else if (previousAddress) {
            // This is a <c> element without an r attribute
            // Assume that it's the cell for the next column
            const { row } = previousAddress;
            const col = previousAddress.col + 1;
            address = {
              row,
              col,
              address: colCache.encodeAddress(row, col),
              $col$row: `$${colCache.n2l(col)}$${row}`,
            } as unknown as { row: number; col: number; address: string };
          }
          previousAddress = address;
          const cell = this.getCellEx(address as { col: number; row: number; address: string });
          (cell as unknown as { model: unknown }).model = cellModel;
          break;
        }
      }
    });

    if (value.height) {
      this.height = value.height;
    } else {
      delete this.height;
    }

    this.hidden = value.hidden;
    this.outlineLevel = value.outlineLevel || 0;

    this.style = (value.style && JSON.parse(JSON.stringify(value.style))) || {};
  }
}

export default Row;
