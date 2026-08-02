import colCache from '../utils/data/col-cache';

export interface IAnchor {
  col: number;
  row: number;
  nativeCol: number;
  nativeRow: number;
  nativeColOff: number;
  nativeRowOff: number;
}

export interface AnchorModel {
  nativeCol: number;
  nativeColOff: number;
  nativeRow: number;
  nativeRowOff: number;
}

export interface AnchorAddressInput {
  col?: number;
  row?: number;
  nativeCol?: number;
  nativeColOff?: number;
  nativeRow?: number;
  nativeRowOff?: number;
}

export interface AnchorWorksheet {
  getColumn(number: number): { isCustomWidth: boolean; width: number | undefined } | undefined;
  getRow(number: number): { height: number | undefined } | undefined;
}

export class Anchor implements IAnchor {
  worksheet: AnchorWorksheet | undefined;
  nativeCol: number;
  nativeColOff: number;
  nativeRow: number;
  nativeRowOff: number;

  constructor(
    worksheet?: AnchorWorksheet,
    address?: string | AnchorAddressInput,
    offset: number = 0
  ) {
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
      this.row = (address.row || 0) + offset;
    } else {
      this.nativeCol = 0;
      this.nativeColOff = 0;
      this.nativeRow = 0;
      this.nativeRowOff = 0;
    }
  }

  static asInstance(
    model: Anchor | AnchorAddressInput | null | undefined
  ): Anchor | null | undefined {
    // NB: preserves original (likely unintended) behavior: `model` is passed
    // as the `worksheet` positional arg, not `address` — since `address` is
    // then undefined, the resulting Anchor's natives are zeroed, not built
    // from `model`. Not fixing here; a typing pass must not change behavior.
    return model instanceof Anchor || model === null || model === undefined
      ? model
      : new Anchor(model as AnchorWorksheet);
  }

  get col() {
    return this.nativeCol + Math.min(this.colWidth - 1, this.nativeColOff) / this.colWidth;
  }

  set col(v: number) {
    this.nativeCol = Math.floor(v);
    this.nativeColOff = Math.floor((v - this.nativeCol) * this.colWidth);
  }

  get row() {
    return this.nativeRow + Math.min(this.rowHeight - 1, this.nativeRowOff) / this.rowHeight;
  }

  set row(v: number) {
    this.nativeRow = Math.floor(v);
    this.nativeRowOff = Math.floor((v - this.nativeRow) * this.rowHeight);
  }

  get colWidth() {
    const column = this.worksheet && this.worksheet.getColumn(this.nativeCol + 1);
    // NB: matches original — if width is undefined here (shouldn't happen
    // when isCustomWidth is true), this yields NaN, same as untyped original.
    return column && column.isCustomWidth ? Math.floor((column.width as number) * 10000) : 640000;
  }

  get rowHeight() {
    const row = this.worksheet && this.worksheet.getRow(this.nativeRow + 1);
    return row && row.height ? Math.floor(row.height * 10000) : 180000;
  }

  get model() {
    return {
      nativeCol: this.nativeCol,
      nativeColOff: this.nativeColOff,
      nativeRow: this.nativeRow,
      nativeRowOff: this.nativeRowOff,
    };
  }

  set model(value: AnchorModel) {
    this.nativeCol = value.nativeCol;
    this.nativeColOff = value.nativeColOff;
    this.nativeRow = value.nativeRow;
    this.nativeRowOff = value.nativeRowOff;
  }
}

export default Anchor;
