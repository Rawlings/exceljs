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

function isRangeModel(value: unknown): value is RangeModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    'top' in value &&
    'left' in value &&
    'bottom' in value &&
    'right' in value
  );
}

// used by worksheet to calculate sheet dimensions
export class Range {
  // decode() always assigns model synchronously in the constructor, but TS
  // can't see through the indirection — definite assignment is correct here.
  model!: RangeModel;

  constructor(...args: unknown[]) {
    this.decode(args);
  }

  setTLBR(t: number | string, l: number | string, b?: number | string, r?: number, s?: string) {
    if (typeof t === 'string' && typeof l === 'string') {
      // setTLBR(tl, br, s)
      const tl = colCache.decodeAddress(t);
      const br = colCache.decodeAddress(l);
      const sheet = typeof b === 'string' ? b : s;
      this.model = {
        top: Math.min(tl.row, br.row),
        left: Math.min(tl.col, br.col),
        bottom: Math.max(tl.row, br.row),
        right: Math.max(tl.col, br.col),
        sheetName: sheet,
      };
    } else {
      // setTLBR(t, l, b, r, s)
      const top = typeof t === 'number' ? t : 0;
      const left = typeof l === 'number' ? l : 0;
      const bottom = typeof b === 'number' ? b : top;
      const right = typeof r === 'number' ? r : left;
      this.model = {
        top: Math.min(top, bottom),
        left: Math.min(left, right),
        bottom: Math.max(top, bottom),
        right: Math.max(left, right),
        sheetName: s,
      };
    }
  }

  decode(argv: unknown[]) {
    switch (argv.length) {
      case 5: // [t,l,b,r,s]
        this.setTLBR(
          typeof argv[0] === 'number' ? argv[0] : 0,
          typeof argv[1] === 'number' ? argv[1] : 0,
          typeof argv[2] === 'number' ? argv[2] : 0,
          typeof argv[3] === 'number' ? argv[3] : 0,
          typeof argv[4] === 'string' ? argv[4] : undefined,
        );
        break;
      case 4: // [t,l,b,r]
        this.setTLBR(
          typeof argv[0] === 'number' ? argv[0] : 0,
          typeof argv[1] === 'number' ? argv[1] : 0,
          typeof argv[2] === 'number' ? argv[2] : 0,
          typeof argv[3] === 'number' ? argv[3] : 0,
        );
        break;

      case 3: // [tl,br,s]
        this.setTLBR(
          String(argv[0]),
          String(argv[1]),
          typeof argv[2] === 'number' || typeof argv[2] === 'string' ? argv[2] : undefined,
        );
        break;
      case 2: // [tl,br]
        this.setTLBR(String(argv[0]), String(argv[1]));
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
        } else if (Array.isArray(value)) {
          // an arguments array
          this.decode(value);
        } else if (isRangeModel(value)) {
          this.model = {
            top: typeof value.top === 'number' ? value.top : 0,
            left: typeof value.left === 'number' ? value.left : 0,
            bottom: typeof value.bottom === 'number' ? value.bottom : 0,
            right: typeof value.right === 'number' ? value.right : 0,
            sheetName: typeof value.sheetName === 'string' ? value.sheetName : undefined,
          };
        } else {
          // [sheetName!]tl:br
          const tlbr = colCache.decodeEx(String(value));
          if (tlbr.top !== undefined) {
            this.model = {
              top: tlbr.top,
              left: tlbr.left ?? 0,
              bottom: tlbr.bottom ?? 0,
              right: tlbr.right ?? 0,
              sheetName: tlbr.sheetName,
            };
          } else {
            const row = tlbr.row ?? 0;
            const col = tlbr.col ?? 0;
            this.model = {
              top: row,
              left: col,
              bottom: row,
              right: col,
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
    const row = address.row ?? 0;
    const col = address.col ?? 0;
    this.expand(row, col, row, col);
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
    return this.containsEx({
      sheetName: address.sheetName,
      row: address.row ?? 0,
      col: address.col ?? 0,
    });
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
