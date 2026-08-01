import colCache from '../utils/col-cache';

export class Anchor {
  worksheet: any;
  nativeCol: number;
  nativeColOff: number;
  nativeRow: number;
  nativeRowOff: number;

  constructor(worksheet?: any, address?: any, offset: number = 0) {
    this.worksheet = worksheet;

    if (!address) {
      this.nativeCol = 0;
      this.nativeColOff = 0;
      this.nativeRow = 0;
      this.nativeRowOff = 0;
    } else if (typeof address === 'string') {
      const decoded = colCache.decodeAddress(address);
      this.nativeCol = decoded.col + offset;
      this.nativeColOff = 0;
      this.nativeRow = decoded.row + offset;
      this.nativeRowOff = 0;
    } else if (address.nativeCol !== undefined) {
      this.nativeCol = address.nativeCol || 0;
      this.nativeColOff = address.nativeColOff || 0;
      this.nativeRow = address.nativeRow || 0;
      this.nativeRowOff = address.nativeRowOff || 0;
    } else if (address.col !== undefined) {
      this.nativeCol = 0;
      this.nativeColOff = 0;
      this.nativeRow = 0;
      this.nativeRowOff = 0;
      this.col = address.col + offset;
      this.row = address.row + offset;
    } else {
      this.nativeCol = 0;
      this.nativeColOff = 0;
      this.nativeRow = 0;
      this.nativeRowOff = 0;
    }
  }

  static asInstance(model: any) {
    return model instanceof Anchor || model === null || model === undefined
      ? model
      : new Anchor(model);
  }

  get col(): number {
    return this.nativeCol + Math.min(this.colWidth - 1, this.nativeColOff) / this.colWidth;
  }

  set col(v: number) {
    this.nativeCol = Math.floor(v);
    this.nativeColOff = Math.floor((v - this.nativeCol) * this.colWidth);
  }

  get row(): number {
    return this.nativeRow + Math.min(this.rowHeight - 1, this.nativeRowOff) / this.rowHeight;
  }

  set row(v: number) {
    this.nativeRow = Math.floor(v);
    this.nativeRowOff = Math.floor((v - this.nativeRow) * this.rowHeight);
  }

  get colWidth(): number {
    return this.worksheet &&
      this.worksheet.getColumn(this.nativeCol + 1) &&
      this.worksheet.getColumn(this.nativeCol + 1).isCustomWidth
      ? Math.floor(this.worksheet.getColumn(this.nativeCol + 1).width * 10000)
      : 640000;
  }

  get rowHeight(): number {
    return this.worksheet &&
      this.worksheet.getRow(this.nativeRow + 1) &&
      this.worksheet.getRow(this.nativeRow + 1).height
      ? Math.floor(this.worksheet.getRow(this.nativeRow + 1).height * 10000)
      : 180000;
  }

  get model() {
    return {
      nativeCol: this.nativeCol,
      nativeColOff: this.nativeColOff,
      nativeRow: this.nativeRow,
      nativeRowOff: this.nativeRowOff,
    };
  }

  set model(value: any) {
    this.nativeCol = value.nativeCol;
    this.nativeColOff = value.nativeColOff;
    this.nativeRow = value.nativeRow;
    this.nativeRowOff = value.nativeRowOff;
  }
}

export default Anchor;
