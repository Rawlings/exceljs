import colCache from '../utils/data/col-cache';

export interface Location {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface RangeModel extends Location {
  sheetName?: string;
}

interface RowLike {
  number: number;
  dimensions: { min: number; max: number } | null;
}

// used by worksheet to calculate sheet dimensions
export class Range {
  // decode() always assigns model synchronously in the constructor, but TS
  // can't see through the indirection — definite assignment is correct here.
  model!: RangeModel;

  constructor(...args: unknown[]) {
    this.decode(args);
  }

  setTLBR(t: number | string, l: number | string, b?: number, r?: number, s?: string) {
    if (arguments.length < 4) {
      // setTLBR(tl, br, s)
      const tl = colCache.decodeAddress(t as string);
      const br = colCache.decodeAddress(l as string);
      this.model = {
        top: Math.min(tl.row, br.row),
        left: Math.min(tl.col, br.col),
        bottom: Math.max(tl.row, br.row),
        right: Math.max(tl.col, br.col),
        sheetName: b as string | undefined,
      };

      this.setTLBR(tl.row, tl.col, br.row, br.col, s);
    } else {
      // setTLBR(t, l, b, r, s)
      const tn = t as number;
      const ln = l as number;
      this.model = {
        top: Math.min(tn, b as number),
        left: Math.min(ln, r as number),
        bottom: Math.max(tn, b as number),
        right: Math.max(ln, r as number),
        sheetName: s,
      };
    }
  }

  decode(argv: unknown[]) {
    switch (argv.length) {
      case 5: // [t,l,b,r,s]
        this.setTLBR(
          argv[0] as number,
          argv[1] as number,
          argv[2] as number,
          argv[3] as number,
          argv[4] as string
        );
        break;
      case 4: // [t,l,b,r]
        this.setTLBR(argv[0] as number, argv[1] as number, argv[2] as number, argv[3] as number);
        break;

      case 3: // [tl,br,s]
        this.setTLBR(argv[0] as string, argv[1] as string, argv[2] as number);
        break;
      case 2: // [tl,br]
        this.setTLBR(argv[0] as string, argv[1] as string);
        break;

      case 1: {
        const value = argv[0];
        if (value instanceof Range) {
          // copy constructor
          this.model = {
            top: value.model.top,
            left: value.model.left,
            bottom: value.model.bottom,
            right: value.model.right,
            sheetName: value.sheetName,
          };
        } else if (value instanceof Array) {
          // an arguments array
          this.decode(value);
        } else if (
          value &&
          typeof value === 'object' &&
          'top' in value &&
          'left' in value &&
          'bottom' in value &&
          'right' in value
        ) {
          // a model
          const v = value as RangeModel;
          this.model = {
            top: v.top,
            left: v.left,
            bottom: v.bottom,
            right: v.right,
            sheetName: v.sheetName,
          };
        } else {
          // [sheetName!]tl:br
          const tlbr = colCache.decodeEx(value as string);
          if (tlbr.top !== undefined) {
            this.model = {
              top: tlbr.top,
              left: tlbr.left as number,
              bottom: tlbr.bottom as number,
              right: tlbr.right as number,
              sheetName: tlbr.sheetName,
            };
          } else {
            this.model = {
              top: tlbr.row as number,
              left: tlbr.col as number,
              bottom: tlbr.row as number,
              right: tlbr.col as number,
              sheetName: tlbr.sheetName,
            };
          }
        }
        break;
      }

      case 0:
        this.model = {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        };
        break;

      default:
        throw new Error(`Invalid number of arguments to _getDimensions() - ${argv.length}`);
    }
  }

  get top() {
    return this.model.top || 1;
  }

  set top(value: number) {
    this.model.top = value;
  }

  get left() {
    return this.model.left || 1;
  }

  set left(value: number) {
    this.model.left = value;
  }

  get bottom() {
    return this.model.bottom || 1;
  }

  set bottom(value: number) {
    this.model.bottom = value;
  }

  get right() {
    return this.model.right || 1;
  }

  set right(value: number) {
    this.model.right = value;
  }

  get sheetName() {
    return this.model.sheetName;
  }

  set sheetName(value: string | undefined) {
    this.model.sheetName = value;
  }

  get _serialisedSheetName() {
    const { sheetName } = this.model;
    if (sheetName) {
      if (/^[a-zA-Z0-9]*$/.test(sheetName)) {
        return `${sheetName}!`;
      }
      return `'${sheetName}'!`;
    }
    return '';
  }

  expand(top: number, left: number, bottom: number, right: number) {
    if (!this.model.top || top < this.top) this.top = top;
    if (!this.model.left || left < this.left) this.left = left;
    if (!this.model.bottom || bottom > this.bottom) this.bottom = bottom;
    if (!this.model.right || right > this.right) this.right = right;
  }

  expandRow(row: RowLike | undefined) {
    if (row) {
      const { dimensions, number } = row;
      if (dimensions) {
        this.expand(number, dimensions.min, number, dimensions.max);
      }
    }
  }

  expandToAddress(addressStr: string) {
    const address = colCache.decodeEx(addressStr);
    this.expand(
      address.row as number,
      address.col as number,
      address.row as number,
      address.col as number
    );
  }

  get tl() {
    return colCache.n2l(this.left) + this.top;
  }

  get $t$l() {
    return `$${colCache.n2l(this.left)}$${this.top}`;
  }

  get br() {
    return colCache.n2l(this.right) + this.bottom;
  }

  get $b$r() {
    return `$${colCache.n2l(this.right)}$${this.bottom}`;
  }

  get range() {
    return `${this._serialisedSheetName + this.tl}:${this.br}`;
  }

  get $range() {
    return `${this._serialisedSheetName + this.$t$l}:${this.$b$r}`;
  }

  get shortRange() {
    return this.count > 1 ? this.range : this._serialisedSheetName + this.tl;
  }

  get $shortRange() {
    return this.count > 1 ? this.$range : this._serialisedSheetName + this.$t$l;
  }

  get count() {
    return (1 + this.bottom - this.top) * (1 + this.right - this.left);
  }

  toString(): string {
    return this.range;
  }

  intersects(other: RangeModel): boolean {
    if (other.sheetName && this.sheetName && other.sheetName !== this.sheetName) return false;
    if (other.bottom < this.top) return false;
    if (other.top > this.bottom) return false;
    if (other.right < this.left) return false;
    if (other.left > this.right) return false;
    return true;
  }

  contains(addressStr: string): boolean {
    const address = colCache.decodeEx(addressStr);
    return this.containsEx(address as { sheetName?: string; row: number; col: number });
  }

  containsEx(address: { sheetName?: string; row: number; col: number }): boolean {
    if (address.sheetName && this.sheetName && address.sheetName !== this.sheetName) return false;
    return (
      address.row >= this.top &&
      address.row <= this.bottom &&
      address.col >= this.left &&
      address.col <= this.right
    );
  }

  forEachAddress(cb: (address: string, row: number, col: number) => void) {
    for (let col = this.left; col <= this.right; col++) {
      for (let row = this.top; row <= this.bottom; row++) {
        cb(colCache.encodeAddress(row, col), row, col);
      }
    }
  }
}

export default Range;
