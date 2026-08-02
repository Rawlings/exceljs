export interface Address {
  address: string;
  col: number;
  row: number;
  $col$row: string;
}

export interface DecodedRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
  tl: string;
  br: string;
  dimensions: string;
}

export interface DecodedExAddress extends Partial<Address> {
  sheetName?: string;
  error?: string;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  tl?: Address & { sheetName?: string };
  br?: Address & { sheetName?: string };
  dimensions?: string;
}

const addressRegex = /^[A-Z]+\d+$/;

const colCache = {
  _hash: {},

  l2n(l: string): number {
    if (!l || typeof l !== 'string') {
      throw new Error(`Out of bounds. Invalid column letter: ${l}`);
    }
    let col = 0;
    const str = l.toUpperCase();
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode < 65 || charCode > 90) {
        throw new Error(`Out of bounds. Invalid column letter: ${l}`);
      }
      col = col * 26 + (charCode - 64);
    }
    if (col < 1 || col > 16384) {
      throw new Error(`Out of bounds. Invalid column letter: ${l}`);
    }
    return col;
  },

  n2l(n: number): string {
    if (n < 1 || n > 16384) {
      throw new Error(`${n} is out of bounds. Excel supports columns from 1 to 16384`);
    }
    let str = '';
    let num = n;
    while (num > 0) {
      const rem = (num - 1) % 26;
      str = String.fromCharCode(65 + rem) + str;
      num = Math.floor((num - 1) / 26);
    }
    return str;
  },

  validateAddress(value: string): boolean {
    if (!addressRegex.test(value)) {
      throw new Error(`Invalid Address: ${value}`);
    }
    return true;
  },

  decodeAddress(value: string): Address {
    const cached = value.length < 5 && (this._hash as Record<string, Address>)[value];
    if (cached) {
      return cached;
    }
    let hasCol = false;
    let col = '';
    let colNumber = 0;
    let hasRow = false;
    let row = '';
    let rowNumber = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      if (!hasRow && char >= 65 && char <= 90) {
        hasCol = true;
        col += value[i];
        colNumber = colNumber * 26 + char - 64;
      } else if (char >= 48 && char <= 57) {
        hasRow = true;
        row += value[i];
        rowNumber = rowNumber * 10 + char - 48;
      } else if (hasRow && hasCol && char !== 36) {
        break;
      }
    }

    if (!hasCol) {
      colNumber = 0;
    } else if (colNumber > 16384) {
      throw new Error(`Out of bounds. Invalid column letter: ${col}`);
    }

    const addrStr = col + row;
    const address: Address = {
      address: addrStr,
      col: colNumber,
      row: rowNumber,
      $col$row: `$${col}$${row}`,
    };

    if (colNumber <= 100 && rowNumber <= 100) {
      (this._hash as Record<string, Address>)[addrStr] = address;
      (this._hash as Record<string, Address>)[address.$col$row] = address;
    }

    return address;
  },

  getAddress(r: number | string, c?: number): Address {
    if (c !== undefined) {
      const address = this.n2l(c) + r;
      return this.decodeAddress(address);
    }
    return this.decodeAddress(r as string);
  },

  decode(value: string): DecodedRange | Address {
    const parts = value.split(':');
    if (parts.length === 2) {
      const tl = this.decodeAddress(parts[0]);
      const br = this.decodeAddress(parts[1]);
      const left = Math.min(tl.col, br.col);
      const top = Math.min(tl.row, br.row);
      const right = Math.max(tl.col, br.col);
      const bottom = Math.max(tl.row, br.row);
      const tlStr = this.n2l(left) + top;
      const brStr = this.n2l(right) + bottom;
      return {
        top,
        left,
        bottom,
        right,
        tl: tlStr,
        br: brStr,
        dimensions: `${tlStr}:${brStr}`,
      };
    }
    return this.decodeAddress(value);
  },

  decodeEx(value: string): DecodedExAddress {
    if (!value || typeof value !== 'string') {
      return { row: 0, col: 0 };
    }
    const groups = value.match(/(?:(?:(?:'((?:[^']|'')*)')|([^'^ !]*))!)?(.*)/);
    if (!groups) {
      return { row: 0, col: 0 };
    }

    const sheetName = groups[1] || groups[2];
    const reference = groups[3];

    const parts = reference.split(':');
    if (parts.length > 1) {
      const tl = this.decodeAddress(parts[0]);
      const br = this.decodeAddress(parts[1]);
      const top = Math.min(tl.row, br.row);
      const left = Math.min(tl.col, br.col);
      const bottom = Math.max(tl.row, br.row);
      const right = Math.max(tl.col, br.col);

      const tlStr = this.n2l(left) + top;
      const brStr = this.n2l(right) + bottom;

      return {
        top,
        left,
        bottom,
        right,
        sheetName,
        tl: {
          address: tlStr,
          col: left,
          row: top,
          $col$row: `$${this.n2l(left)}$${top}`,
          sheetName,
        },
        br: {
          address: brStr,
          col: right,
          row: bottom,
          $col$row: `$${this.n2l(right)}$${bottom}`,
          sheetName,
        },
        dimensions: `${tlStr}:${brStr}`,
      };
    }

    if (reference.startsWith('#')) {
      return sheetName ? { sheetName, error: reference } : { error: reference };
    }

    const address = this.decodeAddress(reference);
    return sheetName ? { sheetName, ...address } : address;
  },

  encodeAddress(row: number, col: number): string {
    return colCache.n2l(col) + row;
  },

  encode(...args: number[]): string {
    if (args.length === 2) {
      return colCache.encodeAddress(args[0], args[1]);
    }
    if (args.length === 4) {
      return `${colCache.encodeAddress(args[0], args[1])}:${colCache.encodeAddress(args[2], args[3])}`;
    }
    throw new Error('Can only encode with 2 or 4 arguments');
  },

  inRange(range: [number, number, number, number, number], address: [number, number]): boolean {
    const [left, top, , right, bottom] = range;
    const [col, row] = address;
    return col >= left && col <= right && row >= top && row <= bottom;
  },
};

export default colCache;
