import { EventEmitter } from 'node:events';
import { NativeZipWriter } from '#src/utils/stream/native-zip';
import StreamBuf from '#src/utils/stream/stream-buf';

class ZipWriter extends EventEmitter {
  options: Record<string, any>;
  zip: NativeZipWriter;
  stream: typeof StreamBuf;

  constructor(options: Record<string, any> = {}) {
    super();
    this.options = {
      type: 'nodebuffer',
      compression: 'DEFLATE',
      ...options,
    };

    this.zip = new NativeZipWriter();
    this.stream = new (StreamBuf as any)();
  }

  append(data: any, options: { name: string; base64?: boolean }): void {
    if (options && options.base64) {
      this.zip.file(options.name, data, { base64: true });
    } else {
      this.zip.file(options.name, data);
    }
  }

  async finalize(): Promise<void> {
    const content = await this.zip.generateAsync(this.options);
    this.stream.end(content);
    this.emit('finish');
  }

  read(size?: number): any {
    return this.stream.read(size);
  }

  setEncoding(encoding: BufferEncoding): any {
    return this.stream.setEncoding(encoding);
  }

  pause(): any {
    return this.stream.pause();
  }

  resume(): any {
    return this.stream.resume();
  }

  isPaused(): boolean {
    return this.stream.isPaused();
  }

  pipe(destination: any, options?: any): any {
    return this.stream.pipe(destination, options);
  }

  unpipe(destination?: any): any {
    return this.stream.unpipe(destination);
  }

  unshift(chunk: any): void {
    return this.stream.unshift(chunk);
  }

  wrap(stream: any): any {
    return this.stream.wrap(stream);
  }
}

export { ZipWriter };
export default {
  ZipWriter,
};
