class StringBuilder {
  private _buf: string[];

  constructor() {
    this._buf = [];
  }

  get length(): number {
    return this._buf.length;
  }

  toString(): string {
    return this._buf.join('');
  }

  reset(position?: number): void {
    if (position !== undefined && position >= 0) {
      this._buf.length = Math.min(this._buf.length, position);
    } else {
      this._buf = [];
    }
  }

  addText(text: string): void {
    this._buf.push(text);
  }

  addStringBuf(inBuf: { toString(): string }): void {
    this._buf.push(inBuf.toString());
  }
}

export default StringBuilder;
