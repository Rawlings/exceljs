import _ from '../utils/helpers/under-dash';
import * as Enums from './enums';
import colCache from '../utils/data/col-cache';
import type { Style, Font, Alignment, Protection, Borders, Fill } from './cell';
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

export interface ColumnModel {
  min: number;
  max: number;
  width?: number;
  style?: Partial<Style>;
  isCustomWidth?: boolean;
  hidden?: boolean;
  outlineLevel?: number;
  collapsed?: boolean;
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
      this.key = value.key;
      this.width = value.width ?? DEFAULT_COLUMN_WIDTH;
      this.outlineLevel = value.outlineLevel ?? 0;
      if (value.style) {
        this.style = value.style;
      } else {
        this.style = {};
      }

      // headers must be set after style
      this.header = value.header;
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
    return Array.isArray(this._header) ? this._header : [this._header];
  }

  get header() {
    return this._header;
  }

  set header(value: string | string[] | undefined) {
    if (value !== undefined) {
      this._header = value;
      this.headers.forEach((text, index) => {
        this._worksheet.getCell!(index + 1, this.number).value = text;
      });
    } else {
      this._header = undefined;
    }
  }

  get key() {
    return this._key;
  }

  set key(value: string | undefined) {
    if (this._key) {
      const column = this._worksheet.getColumnKey?.(this._key);
      if (column === (this as ColumnLike)) {
        this._worksheet.deleteColumnKey?.(this._key);
      }
    }

    this._key = value;
    if (value) {
      this._worksheet.setColumnKey?.(value, this);
    }
  }

  get hidden() {
    return !!this._hidden;
  }

  set hidden(value: boolean) {
    this._hidden = value;
  }

  get outlineLevel() {
    return this._outlineLevel ?? 0;
  }

  set outlineLevel(value: number) {
    this._outlineLevel = value;
  }

  get collapsed() {
    return !!(
      this._outlineLevel && this._outlineLevel >= (this._worksheet.properties?.outlineLevelCol ?? 0)
    );
  }

  toString(): string {
    return JSON.stringify({
      key: this.key,
      width: this.width,
      headers: this.headers.length ? this.headers : undefined,
    });
  }

  equivalentTo(other: ColumnLike | ColumnModel): boolean {
    return (
      this.width === other.width &&
      this.hidden === !!other.hidden &&
      this.outlineLevel === (other.outlineLevel ?? 0) &&
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
    if (s.font || s.numFmt || s.alignment || s.border || s.fill || s.protection) {
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
    iteratee: (cell: CellLike, rowNumber: number) => void,
  ): void;
  eachCell(
    options: EachRowOptions | null | ((cell: CellLike, rowNumber: number) => void),
    iteratee?: (cell: CellLike, rowNumber: number) => void,
  ) {
    const colNumber = this.number;
    const callback = typeof options === 'function' ? options : iteratee;
    const eachOptions = typeof options === 'function' ? null : options;
    if (callback) {
      this._worksheet.eachRow?.(
        eachOptions,
        (row: { getCell(n: number): CellLike }, rowNumber: number) => {
          callback(row.getCell(colNumber), rowNumber);
        },
      );
    }
  }

  get values() {
    const v: unknown[] = [];
    this.eachCell((cell: CellLike, rowNumber: number) => {
      if (cell.type !== Enums.ValueType.Null) {
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
      this._worksheet.getCell!(index + offset, colNumber).value = value;
    });
  }

  // =========================================================================
  // styles
  _applyStyle<K extends keyof Style>(name: K, value: Style[K] | undefined) {
    if (value === undefined) {
      delete this.style[name];
    } else {
      this.style[name] = value;
    }
    this.eachCell((cell: CellLike) => {
      cell.style[name] = value;
    });
    return value;
  }

  get numFmt() {
    return this.style.numFmt;
  }

  set numFmt(value: string | undefined) {
    this._applyStyle('numFmt', value);
  }

  get font() {
    return this.style.font;
  }

  set font(value: Partial<Font> | undefined) {
    this._applyStyle('font', value);
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value: Partial<Alignment> | undefined) {
    this._applyStyle('alignment', value);
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value: Partial<Protection> | undefined) {
    this._applyStyle('protection', value);
  }

  get border() {
    return this.style.border;
  }

  set border(value: Partial<Borders> | undefined) {
    this._applyStyle('border', value);
  }

  get fill() {
    return this.style.fill;
  }

  set fill(value: Fill | undefined) {
    this._applyStyle('fill', value);
  }

  // =============================================================================
  // static functions

  static toModel(columns: Column[] | undefined) {
    // Convert array of Column into compressed list cols
    const cols: ColumnModel[] = [];
    let col: ColumnModel | null = null;
    if (columns) {
      columns.forEach((column: Column, index: number) => {
        if (column.isDefault) {
          if (col) {
            col = null;
          }
        } else if (!col || !column.equivalentTo(col)) {
          col = {
            min: index + 1,
            max: index + 1,
            width: column.width ?? DEFAULT_COLUMN_WIDTH,
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

  static fromModel(worksheet: WorksheetLike, cols: ColumnModel[] | undefined) {
    const list = cols ? cols.toSorted((pre, next) => pre.min - next.min) : [];
    const columns: Column[] = [];
    let count = 1;
    let index = 0;
    while (index < list.length) {
      const col = list[index++];
      while (count < col.min) {
        columns.push(new Column(worksheet, count++));
      }
      while (count <= col.max) {
        columns.push(
          new Column(worksheet, count++, {
            width: col.width,
            style: col.style,
            hidden: col.hidden,
            outlineLevel: col.outlineLevel,
          }),
        );
      }
    }
    return columns.length ? columns : null;
  }
}

export default Column;
