import { Duplex, Writable } from 'node:stream';

class StreamBase64 extends Duplex {
  pipes: Writable[];
  encoding?: BufferEncoding;

  constructor() {
    super();
    this.pipes = [];
  }

  write(..._args: any[]): boolean {
    return true;
  }

  cork(): void {}

  uncork(): void {}

  end(..._args: any[]): this {
    return this;
  }

  read(_size?: number): any {}

  setEncoding(encoding: BufferEncoding): this {
    this.encoding = encoding;
    return this;
  }

  pause(): this {
    return this;
  }

  resume(): this {
    return this;
  }

  isPaused(): boolean {
    return false;
  }

  pipe<T extends NodeJS.WritableStream>(destination: T, _options?: any): T {
    this.pipes.push(destination as unknown as Writable);
    return destination;
  }

  unpipe(destination?: any): this {
    this.pipes = this.pipes.filter((pipe) => pipe !== destination);
    return this;
  }

  unshift(_chunk: any, _encoding?: any): void {
    throw new Error('Not Implemented');
  }

  wrap(_stream: any): this {
    throw new Error('Not Implemented');
  }
}

export default StreamBase64;
