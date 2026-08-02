import events from 'events';
import { NativeZipWriter as JSZip } from '#src/utils/native-zip';

import StreamBuf from '#src/utils/stream-buf';

// =============================================================================
// The ZipWriter class
// Packs streamed data into an output zip stream
class ZipWriter extends events.EventEmitter {
  options: any;
  zip: any;
  stream: any;

  constructor(options: any) {
    super();
    this.options = Object.assign(
      {
        type: 'nodebuffer',
        compression: 'DEFLATE',
      },
      options
    );

    this.zip = new (JSZip as new (...args: any[]) => any)();
    this.stream = new (StreamBuf as unknown as new (options?: any) => any)();
  }

  append(data: any, options: any) {
    if (options.hasOwnProperty('base64') && options.base64) {
      this.zip.file(options.name, data, { base64: true });
    } else {
      this.zip.file(options.name, data);
    }
  }

  async finalize() {
    const content = await this.zip.generateAsync(this.options);
    this.stream.end(content);
    this.emit('finish');
  }

  // ==========================================================================
  // Stream.Readable interface
  read(size: any) {
    return this.stream.read(size);
  }

  setEncoding(encoding: any) {
    return this.stream.setEncoding(encoding);
  }

  pause() {
    return this.stream.pause();
  }

  resume() {
    return this.stream.resume();
  }

  isPaused() {
    return this.stream.isPaused();
  }

  pipe(destination: any, options?: any) {
    return this.stream.pipe(destination, options);
  }

  unpipe(destination: any) {
    return this.stream.unpipe(destination);
  }

  unshift(chunk: any) {
    return this.stream.unshift(chunk);
  }

  wrap(stream: any) {
    return this.stream.wrap(stream);
  }
}

// =============================================================================

export { ZipWriter };
export default {
  ZipWriter,
};
