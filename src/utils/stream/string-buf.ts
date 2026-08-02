class StringBuf {
  private _buf: Buffer;
  private _encoding: BufferEncoding;
  private _inPos: number;
  private _buffer?: Buffer;

  constructor(options?: { size?: number; encoding?: BufferEncoding }) {
    this._buf = Buffer.alloc((options && options.size) || 16384);
    this._encoding = (options && options.encoding) || 'utf8';
    this._inPos = 0;
    this._buffer = undefined;
  }

  get length(): number {
    return this._inPos;
  }

  get capacity(): number {
    return this._buf.length;
  }

  get buffer(): Buffer {
    return this._buf;
  }

  toBuffer(): Buffer {
    if (!this._buffer) {
      this._buffer = Buffer.alloc(this.length);
      this._buf.copy(this._buffer, 0, 0, this.length);
    }
    return this._buffer;
  }

  reset(position = 0): void {
    this._buffer = undefined;
    this._inPos = position;
  }

  private _grow(min: number): void {
    let size = this._buf.length * 2;
    while (size < min) {
      size *= 2;
    }
    const buf = Buffer.alloc(size);
    this._buf.copy(buf, 0);
    this._buf = buf;
  }

  addText(text: string): void {
    this._buffer = undefined;
    let inPos = this._inPos + this._buf.write(text, this._inPos, this._encoding);

    while (inPos >= this._buf.length - 4) {
      this._grow(this._inPos + text.length);
      inPos = this._inPos + this._buf.write(text, this._inPos, this._encoding);
    }

    this._inPos = inPos;
  }

  addStringBuf(inBuf: StringBuf): void {
    if (inBuf.length) {
      this._buffer = undefined;

      if (this.length + inBuf.length > this.capacity) {
        this._grow(this.length + inBuf.length);
      }
      inBuf._buf.copy(this._buf, this._inPos, 0, inBuf.length);
      this._inPos += inBuf.length;
    }
  }
}

export default StringBuf;
