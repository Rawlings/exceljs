/* eslint-disable max-classes-per-file */
import Stream from 'node:stream';
import utils from '#src/utils/helpers/utils';
import StringBuf from '#src/utils/stream/string-buf';

class StringChunk {
  private _data: any;
  private _encoding: BufferEncoding;
  private _buffer?: Buffer;

  constructor(data: any, encoding: BufferEncoding) {
    this._data = data;
    this._encoding = encoding;
  }

  get length(): number {
    return this.toBuffer().length;
  }

  copy(target: Buffer, targetOffset: number, offset: number, length: number): number {
    return this.toBuffer().copy(target, targetOffset, offset, length);
  }

  toBuffer(): Buffer {
    if (!this._buffer) {
      this._buffer = Buffer.from(this._data, this._encoding);
    }
    return this._buffer;
  }
}

class StringBufChunk {
  private _data: StringBuf;

  constructor(data: StringBuf) {
    this._data = data;
  }

  get length(): number {
    return this._data.length;
  }

  copy(target: Buffer, targetOffset: number, offset: number, length: number): number {
    return this._data.buffer.copy(target, targetOffset, offset, length);
  }

  toBuffer(): Buffer {
    return this._data.toBuffer();
  }
}

class BufferChunk {
  private _data: Buffer;

  constructor(data: Buffer) {
    this._data = data;
  }

  get length(): number {
    return this._data.length;
  }

  copy(target: Buffer, targetOffset: number, offset: number, length: number): number {
    return this._data.copy(target, targetOffset, offset, length);
  }

  toBuffer(): Buffer {
    return this._data;
  }
}

class ReadWriteBuf {
  size: number;
  buffer: Buffer;
  iRead: number;
  iWrite: number;

  constructor(size: number) {
    this.size = size;
    this.buffer = Buffer.alloc(size);
    this.iRead = 0;
    this.iWrite = 0;
  }

  toBuffer(): Buffer {
    if (this.iRead === 0 && this.iWrite === this.size) {
      return this.buffer;
    }
    const buf = Buffer.alloc(this.iWrite - this.iRead);
    this.buffer.copy(buf, 0, this.iRead, this.iWrite);
    return buf;
  }

  get length(): number {
    return this.iWrite - this.iRead;
  }

  get eod(): boolean {
    return this.iRead === this.iWrite;
  }

  get full(): boolean {
    return this.iWrite === this.size;
  }

  read(size?: number): Buffer | null {
    if (size === 0) {
      return null;
    }
    if (size === undefined || size >= this.length) {
      const buf = this.toBuffer();
      this.iRead = this.iWrite;
      return buf;
    }
    const buf = Buffer.alloc(size);
    this.buffer.copy(buf, 0, this.iRead, this.iRead + size);
    this.iRead += size;
    return buf;
  }

  write(chunk: any, offset: number, length: number): number {
    const size = Math.min(length, this.size - this.iWrite);
    chunk.copy(this.buffer, this.iWrite, offset, offset + size);
    this.iWrite += size;
    return size;
  }
}

const StreamBuf = function (this: any, options?: any) {
  options = options || {};
  this.bufSize = options.bufSize || 1024 * 1024;
  this.buffers = [];
  this.batch = options.batch || false;
  this.corked = false;
  this.inPos = 0;
  this.outPos = 0;
  this.pipes = [];
  this.paused = false;
  this.encoding = null;
} as any;

utils.inherits(StreamBuf, Stream.Duplex, null, {
  toBuffer() {
    switch (this.buffers.length) {
      case 0:
        return null;
      case 1:
        return this.buffers[0].toBuffer();
      default:
        return Buffer.concat(this.buffers.map((rwBuf: any) => rwBuf.toBuffer()));
    }
  },

  _getWritableBuffer() {
    if (this.buffers.length) {
      const last = this.buffers[this.buffers.length - 1];
      if (!last.full) {
        return last;
      }
    }
    const buf = new ReadWriteBuf(this.bufSize);
    this.buffers.push(buf);
    return buf;
  },

  async _pipe(chunk: any) {
    const write = (pipe: any) =>
      new Promise<void>((resolve) => {
        pipe.write(chunk.toBuffer(), () => {
          resolve();
        });
      });
    await Promise.all(this.pipes.map(write));
  },

  _writeToBuffers(chunk: any) {
    let inPos = 0;
    const inLen = chunk.length;
    while (inPos < inLen) {
      const buffer = this._getWritableBuffer();
      inPos += buffer.write(chunk, inPos, inLen - inPos);
    }
  },

  async write(data: any, encoding?: any, callback?: any) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }
    callback = callback || utils.nop;

    let chunk: StringBufChunk | BufferChunk | StringChunk;
    if (data instanceof StringBuf) {
      chunk = new StringBufChunk(data);
    } else if (Buffer.isBuffer(data)) {
      chunk = new BufferChunk(data);
    } else if (typeof data === 'string' || data instanceof String || data instanceof ArrayBuffer) {
      chunk = new StringChunk(data, encoding || 'utf8');
    } else {
      throw new Error('Chunk must be one of type String, Buffer or StringBuf.');
    }

    if (this.pipes.length) {
      if (this.batch) {
        this._writeToBuffers(chunk);
        while (!this.corked && this.buffers.length > 1) {
          this._pipe(this.buffers.shift());
        }
      } else if (!this.corked) {
        await this._pipe(chunk);
        callback();
      } else {
        this._writeToBuffers(chunk);
        process.nextTick(callback);
      }
    } else {
      if (!this.paused) {
        this.emit('data', chunk.toBuffer());
      }
      this._writeToBuffers(chunk);
      this.emit('readable');
    }

    return true;
  },

  cork() {
    this.corked = true;
  },

  _flush() {
    if (this.pipes.length) {
      while (this.buffers.length) {
        this._pipe(this.buffers.shift());
      }
    }
  },

  uncork() {
    this.corked = false;
    this._flush();
  },

  end(chunk?: any, encoding?: any, callback?: any) {
    const writeComplete = (error?: any) => {
      if (error) {
        if (typeof callback === 'function') callback(error);
      } else {
        this._flush();
        this.pipes.forEach((pipe: any) => {
          pipe.end();
        });
        this.emit('finish');
      }
    };
    if (chunk) {
      this.write(chunk, encoding, writeComplete);
    } else {
      writeComplete();
    }
  },

  read(size?: number) {
    let buffers: Buffer[];
    if (size) {
      buffers = [];
      while (size && this.buffers.length && !this.buffers[0].eod) {
        const first = this.buffers[0];
        const buffer = first.read(size);
        if (buffer) {
          size -= buffer.length;
          buffers.push(buffer);
        }
        if (first.eod && first.full) {
          this.buffers.shift();
        }
      }
      return Buffer.concat(buffers);
    }

    buffers = this.buffers.map((buf: any) => buf.toBuffer()).filter(Boolean);
    this.buffers = [];
    return Buffer.concat(buffers);
  },

  setEncoding(encoding: BufferEncoding) {
    this.encoding = encoding;
  },

  pause() {
    this.paused = true;
  },

  resume() {
    this.paused = false;
  },

  isPaused() {
    return Boolean(this.paused);
  },

  pipe(destination: any) {
    this.pipes.push(destination);
    if (!this.paused && this.buffers.length) {
      this.end();
    }
  },

  unpipe(destination?: any) {
    this.pipes = this.pipes.filter((pipe: any) => pipe !== destination);
  },

  unshift() {
    throw new Error('Not Implemented');
  },

  wrap() {
    throw new Error('Not Implemented');
  },
});

export default StreamBuf;
