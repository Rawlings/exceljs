import _ from '../utils/helpers/under-dash';
import Enums from './enums';
import colCache from '../utils/data/col-cache';
import type { Style } from './cell';
import type { WorksheetLike, ColumnLike, CellLike, EachRowOptions } from './internal-types';

const DEFAULT_COLUMN_WIDTH = 9;

export interface ColumnDefinition {
  header?: string | string[];
  key?: string;
  width?: number;
  style?: Partial<Style>;
  hidden?: boolean;
  outlineLevel?: number;
}

// Column defines the column properties for 1 column.
// This includes header rows, widths, key, (style), etc.
// Worksheet will condense the columns as appropriate during serialization
export class Column implements ColumnLike {
  _worksheet: WorksheetLike;
  _number: number;
  _header: string | string[] | undefined;
  _key: string | undefined;
  width: number | undefined;
  style: Partial<Style> = {};
  _hidden: boolean | undefined;
  _outlineLevel: number | undefined;

  constructor(worksheet: WorksheetLike, number: number, defn?: ColumnDefinition | false) {
    this._worksheet = worksheet;
    this._number = number;
    if (defn !== false) {
      // sometimes defn will follow
      this.defn = defn;
    }
  }

  get number() {
    return this._number;
  }

  get worksheet() {
    return this._worksheet;
  }

  get letter() {
    return colCache.n2l(this._number);
  }

  get isCustomWidth() {
    return this.width !== undefined && this.width !== DEFAULT_COLUMN_WIDTH;
  }

  get defn() {
    return {
      header: this._header,
      key: this.key,
      width: this.width,
      style: this.style,
      hidden: this.hidden,
      outlineLevel: this.outlineLevel,
    };
  }

  set defn(value: ColumnDefinition | undefined) {
    if (value) {
      this.key = value.key as string;
      this.width = value.width !== undefined ? value.width : DEFAULT_COLUMN_WIDTH;
      this.outlineLevel = value.outlineLevel as number;
      if (value.style) {
        this.style = value.style;
      } else {
        this.style = {};
      }

      // headers must be set after style
      this.header = value.header as string;
      this._hidden = !!value.hidden;
    } else {
      delete this._header;
      delete this._key;
      delete this.width;
      this.style = {};
      this.outlineLevel = 0;
    }
  }

  get headers() {
    return this._header && this._header instanceof Array ? this._header : [this._header];
  }

  get header() {
    return this._header;
  }

  set header(value: string | string[] | undefined) {
    if (value !== undefined) {
      this._header = value;
      this.headers.forEach((text, index) => {
        this._worksheet.getCell(index + 1, this.number).value = text;
      });
    } else {
      this._header = undefined;
    }
  }

  get key() {
    return this._key;
  }

  set key(value: string | undefined) {
    const column = this._key && this._worksheet.getColumnKey(this._key);
    if (column === (this as unknown as ColumnLike)) {
      this._worksheet.deleteColumnKey(this._key as string);
    }

    this._key = value;
    if (value) {
      this._worksheet.setColumnKey(value, this);
    }
  }

  get hidden() {
    return !!this._hidden;
  }

  set hidden(value: boolean) {
    this._hidden = value;
  }

  get outlineLevel() {
    return this._outlineLevel || 0;
  }

  set outlineLevel(value: number) {
    this._outlineLevel = value;
  }

  get collapsed() {
    return !!(
      this._outlineLevel && this._outlineLevel >= this._worksheet.properties.outlineLevelCol
    );
  }

  toString(): string {
    return JSON.stringify({
      key: this.key,
      width: this.width,
      headers: this.headers.length ? this.headers : undefined,
    });
  }

  equivalentTo(other: ColumnLike): boolean {
    return (
      this.width === other.width &&
      this.hidden === other.hidden &&
      this.outlineLevel === other.outlineLevel &&
      _.isEqual(this.style, other.style)
    );
  }

  get isDefault() {
    if (this.isCustomWidth) {
      return false;
    }
    if (this.hidden) {
      return false;
    }
    if (this.outlineLevel) {
      return false;
    }
    const s = this.style;
    if (s && (s.font || s.numFmt || s.alignment || s.border || s.fill || s.protection)) {
      return false;
    }
    return true;
  }

  get headerCount() {
    return this.headers.length;
  }

  eachCell(iteratee: (cell: CellLike, rowNumber: number) => void): void;
  eachCell(
    options: EachRowOptions | null,
    iteratee: (cell: CellLike, rowNumber: number) => void
  ): void;
  eachCell(
    options: EachRowOptions | null | ((cell: CellLike, rowNumber: number) => void),
    iteratee?: (cell: CellLike, rowNumber: number) => void
  ) {
    const colNumber = this.number;
    if (!iteratee) {
      iteratee = options as (cell: CellLike, rowNumber: number) => void;
      options = null;
    }
    this._worksheet.eachRow(
      options as EachRowOptions | null,
      (row: { getCell(n: number): CellLike }, rowNumber: number) => {
        iteratee(row.getCell(colNumber), rowNumber);
      }
    );
  }

  get values() {
    const v: unknown[] = [];
    this.eachCell((cell: CellLike, rowNumber: number) => {
      if (cell && cell.type !== Enums.ValueType.Null) {
        v[rowNumber] = cell.value;
      }
    });
    return v;
  }

  set values(v: unknown[] | undefined) {
    if (!v) {
      return;
    }
    const colNumber = this.number;
    let offset = 0;
    if (Object.prototype.hasOwnProperty.call(v, '0')) {
      // assume contiguous array, start at row 1
      offset = 1;
    }
    v.forEach((value, index) => {
      this._worksheet.getCell(index + offset, colNumber).value = value;
    });
  }

  // =========================================================================
  // styles
  _applyStyle(name: string, value: unknown) {
    (this.style as Record<string, unknown>)[name] = value;
    this.eachCell((cell: CellLike) => {
      (cell as unknown as Record<string, unknown>)[name] = value;
    });
    return value;
  }

  get numFmt() {
    return this.style.numFmt;
  }

  set numFmt(value: unknown) {
    this._applyStyle('numFmt', value);
  }

  get font() {
    return this.style.font;
  }

  set font(value: unknown) {
    this._applyStyle('font', value);
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value: unknown) {
    this._applyStyle('alignment', value);
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value: unknown) {
    this._applyStyle('protection', value);
  }

  get border() {
    return this.style.border;
  }

  set border(value: unknown) {
    this._applyStyle('border', value);
  }

  get fill() {
    return this.style.fill;
  }

  set fill(value: unknown) {
    this._applyStyle('fill', value);
  }

  // =============================================================================
  // static functions

  static toModel(columns: Column[] | undefined) {
    // Convert array of Column into compressed list cols
    const cols: Record<string, unknown>[] = [];
    let col: Record<string, unknown> | null = null;
    if (columns) {
      columns.forEach((column: Column, index: number) => {
        if (column.isDefault) {
          if (col) {
            col = null;
          }
        } else if (!col || !column.equivalentTo(col as unknown as ColumnLike)) {
          col = {
            min: index + 1,
            max: index + 1,
            width: column.width !== undefined ? column.width : DEFAULT_COLUMN_WIDTH,
            style: column.style,
            isCustomWidth: column.isCustomWidth,
            hidden: column.hidden,
            outlineLevel: column.outlineLevel,
            collapsed: column.collapsed,
          };
          cols.push(col);
        } else {
          col.max = index + 1;
        }
      });
    }
    return cols.length ? cols : undefined;
  }

  static fromModel(
    worksheet: WorksheetLike,
    cols: Array<Record<string, unknown> & { min: number; max: number }> | undefined
  ) {
    cols = cols || [];
    const columns: Column[] = [];
    let count = 1;
    let index = 0;
    /**
     * sort cols by min
     * If it is not sorted, the subsequent column configuration will be overwritten
     * */
    cols = cols.sort((pre, next) => pre.min - next.min);
    while (index < cols.length) {
      const col = cols[index++];
      while (count < col.min) {
        columns.push(new Column(worksheet, count++));
      }
      while (count <= col.max) {
        columns.push(new Column(worksheet, count++, col as unknown as ColumnDefinition));
      }
    }
    return columns.length ? columns : null;
  }
}

export default Column;
