import _ from '../utils/under-dash';
import Enums from './enums';
import colCache from '../utils/col-cache';

const DEFAULT_COLUMN_WIDTH = 9;

// Column defines the column properties for 1 column.
// This includes header rows, widths, key, (style), etc.
// Worksheet will condense the columns as appropriate during serialization
class Column {
  _worksheet: any;
  _number: any;
  _header: any;
  _key: any;
  width: any;
  style: any;
  _hidden: any;
  _outlineLevel: any;

  constructor(worksheet: any, number: any, defn?: any) {
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

  set defn(value: any) {
    if (value) {
      this.key = value.key;
      this.width = value.width !== undefined ? value.width : DEFAULT_COLUMN_WIDTH;
      this.outlineLevel = value.outlineLevel;
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
    return this._header && this._header instanceof Array ? this._header : [this._header];
  }

  get header() {
    return this._header;
  }

  set header(value: any) {
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

  set key(value: any) {
    const column = this._key && this._worksheet.getColumnKey(this._key);
    if (column === this) {
      this._worksheet.deleteColumnKey(this._key);
    }

    this._key = value;
    if (value) {
      this._worksheet.setColumnKey(this._key, this);
    }
  }

  get hidden() {
    return !!this._hidden;
  }

  set hidden(value: any) {
    this._hidden = value;
  }

  get outlineLevel() {
    return this._outlineLevel || 0;
  }

  set outlineLevel(value: any) {
    this._outlineLevel = value;
  }

  get collapsed() {
    return !!(
      this._outlineLevel && this._outlineLevel >= this._worksheet.properties.outlineLevelCol
    );
  }

  toString() {
    return JSON.stringify({
      key: this.key,
      width: this.width,
      headers: this.headers.length ? this.headers : undefined,
    });
  }

  equivalentTo(other: any) {
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

  eachCell(options: any, iteratee?: any) {
    const colNumber = this.number;
    if (!iteratee) {
      iteratee = options;
      options = null;
    }
    this._worksheet.eachRow(options, (row: any, rowNumber: any) => {
      iteratee(row.getCell(colNumber), rowNumber);
    });
  }

  get values() {
    const v: any[] = [];
    this.eachCell((cell: any, rowNumber: any) => {
      if (cell && cell.type !== Enums.ValueType.Null) {
        v[rowNumber] = cell.value;
      }
    });
    return v;
  }

  set values(v: any) {
    if (!v) {
      return;
    }
    const colNumber = this.number;
    let offset = 0;
    if (v.hasOwnProperty('0')) {
      // assume contiguous array, start at row 1
      offset = 1;
    }
    v.forEach((value: any, index: any) => {
      this._worksheet.getCell(index + offset, colNumber).value = value;
    });
  }

  // =========================================================================
  // styles
  _applyStyle(name: any, value: any) {
    this.style[name] = value;
    this.eachCell((cell: any) => {
      cell[name] = value;
    });
    return value;
  }

  get numFmt() {
    return this.style.numFmt;
  }

  set numFmt(value: any) {
    this._applyStyle('numFmt', value);
  }

  get font() {
    return this.style.font;
  }

  set font(value: any) {
    this._applyStyle('font', value);
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value: any) {
    this._applyStyle('alignment', value);
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value: any) {
    this._applyStyle('protection', value);
  }

  get border() {
    return this.style.border;
  }

  set border(value: any) {
    this._applyStyle('border', value);
  }

  get fill() {
    return this.style.fill;
  }

  set fill(value: any) {
    this._applyStyle('fill', value);
  }

  // =============================================================================
  // static functions

  static toModel(columns: any) {
    // Convert array of Column into compressed list cols
    const cols: any[] = [];
    let col: any = null;
    if (columns) {
      columns.forEach((column: any, index: any) => {
        if (column.isDefault) {
          if (col) {
            col = null;
          }
        } else if (!col || !column.equivalentTo(col)) {
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

  static fromModel(worksheet: any, cols: any) {
    cols = cols || [];
    const columns = [];
    let count = 1;
    let index = 0;
    /**
     * sort cols by min
     * If it is not sorted, the subsequent column configuration will be overwritten
     * */
    cols = cols.sort(function (pre: any, next: any) {
      return pre.min - next.min;
    });
    while (index < cols.length) {
      const col = cols[index++];
      while (count < col.min) {
        columns.push(new Column(worksheet, count++));
      }
      while (count <= col.max) {
        columns.push(new Column(worksheet, count++, col));
      }
    }
    return columns.length ? columns : null;
  }
}

export default Column;
