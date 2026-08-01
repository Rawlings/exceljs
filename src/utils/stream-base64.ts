import Stream from 'stream';

// =============================================================================
// StreamBase64 - A utility to convert to/from base64 stream
// Note: does not buffer data, must be piped
class StreamBase64 extends Stream.Duplex {
  pipes: any[];
  encoding: any;

  constructor() {
    super();

    // consuming pipe streams go here
    this.pipes = [];
  }

  // writable
  write(..._args: any[]): boolean {
    return true;
  }

  cork() {}

  uncork() {}

  end(..._args: any[]): this {
    return this;
  }

  // readable
  read(_size?: number): any {}

  setEncoding(encoding: any): this {
    // causes stream.read or stream.on('data) to return strings of encoding instead of Buffer objects
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
    // add destination to pipe list & write current buffer
    this.pipes.push(destination);
    return destination;
  }

  unpipe(destination?: any): this {
    // remove destination from pipe list
    this.pipes = this.pipes.filter((pipe: any) => pipe !== destination);
    return this;
  }

  unshift(_chunk: any, _encoding?: any): void {
    // some numpty has read some data that's not for them and they want to put it back!
    // Might implement this some day
    throw new Error('Not Implemented');
  }

  wrap(_stream: any): this {
    // not implemented
    throw new Error('Not Implemented');
  }
}

export default StreamBase64;
