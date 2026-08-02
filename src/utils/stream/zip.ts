import * as fflate from 'fflate';

export interface ZipEntry {
  name: string;
  dir: boolean;
  async(type?: 'string' | 'utf8' | 'nodebuffer' | string): Promise<any>;
  buffer: Buffer;
}

export class ZipReader {
  files: Record<string, ZipEntry> = {};

  constructor(input?: Buffer | ArrayBuffer) {
    if (input) {
      this.parse(Buffer.isBuffer(input) ? input : Buffer.from(input));
    }
  }

  parse(buf: Buffer): void {
    if (!buf || buf.length === 0) return;
    const u8input = new Uint8Array(buf.byteLength);
    u8input.set(buf);
    const unzipped = fflate.unzipSync(u8input);
    for (const [key, u8] of Object.entries(unzipped)) {
      const cleanName = key.replace(/^\//, '');
      const content = Buffer.from(u8);
      this.files[cleanName] = {
        name: cleanName,
        dir: cleanName.endsWith('/'),
        async: async (type?: string) =>
          type === 'string' || type === 'utf8' ? content.toString('utf8') : content,
        buffer: content,
      };
    }
  }

  static async loadAsync(input: any): Promise<ZipReader> {
    let buf: Buffer;
    if (Buffer.isBuffer(input)) {
      buf = input;
    } else if (input instanceof ArrayBuffer) {
      buf = Buffer.from(input);
    } else if (typeof input === 'string') {
      buf = Buffer.from(input, 'utf8');
    } else if (
      input &&
      typeof input === 'object' &&
      (typeof input.read === 'function' ||
        Symbol.asyncIterator in input ||
        typeof input.on === 'function')
    ) {
      const chunks: Buffer[] = [];
      if (Symbol.asyncIterator in input) {
        for await (const chunk of input) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
        }
      } else if (typeof input.read === 'function') {
        let chunk: any;
        while ((chunk = input.read()) !== null) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      } else if (typeof input.on === 'function') {
        await new Promise<void>((resolve) => {
          input.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          const onEnd = () => resolve();
          if (input.readableEnded || input._readableState?.ended) {
            onEnd();
          } else {
            input.on('end', onEnd);
            input.on('close', onEnd);
            input.on('error', onEnd);
          }
        });
      }
      buf = Buffer.concat(chunks);
    } else {
      throw new Error(
        "Can't read the data of 'the loaded zip file'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"
      );
    }
    return new ZipReader(buf);
  }

  file(name: string): ZipEntry | undefined {
    return this.files[name.replace(/^\//, '')];
  }
}

export class ZipWriter {
  private files: Record<string, Uint8Array> = {};
  private pending: Promise<void>[] = [];
  private options: Record<string, any>;

  constructor(options: Record<string, any> = {}) {
    this.options = options;
  }

  append(data: any, options: { name?: string; base64?: boolean } | string = {}): void {
    const rawName = typeof options === 'string' ? options : options.name || 'file';
    const name = rawName.replace(/^\//, '');

    if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      const u8 = new Uint8Array(data.byteLength);
      u8.set(data);
      this.files[name] = u8;
    } else if (data instanceof ArrayBuffer) {
      this.files[name] = new Uint8Array(data);
    } else if (typeof data === 'string') {
      const isBase64 = typeof options === 'object' && options?.base64;
      if (isBase64) {
        const buf = Buffer.from(data, 'base64');
        const u8 = new Uint8Array(buf.byteLength);
        u8.set(buf);
        this.files[name] = u8;
      } else {
        this.files[name] = fflate.strToU8(data);
      }
    } else if (data && typeof data.xml === 'string') {
      this.files[name] = fflate.strToU8(data.xml);
    } else if (data && typeof data.toXml === 'function') {
      this.files[name] = fflate.strToU8(data.toXml());
    } else if (data && typeof data.toBuffer === 'function') {
      const buf = data.toBuffer();
      if (Buffer.isBuffer(buf) || buf instanceof Uint8Array) {
        const u8 = new Uint8Array(buf.byteLength);
        u8.set(buf);
        this.files[name] = u8;
      } else if (typeof buf === 'string') {
        this.files[name] = fflate.strToU8(buf);
      }
    } else if (data && (typeof data.read === 'function' || typeof data.on === 'function')) {
      const chunks: Buffer[] = [];
      const processStream = async () => {
        await new Promise<void>((resolve) => {
          if (typeof data.on === 'function') {
            data.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            if (typeof data.resume === 'function') {
              data.resume();
            }
            const onFinish = () => {
              // drain any buffered data from the readable side (handles paused streams)
              if (typeof data.read === 'function') {
                let chunk: any;
                while ((chunk = data.read()) !== null) {
                  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
              }
              resolve();
            };
            if (data.readableEnded || data._readableState?.ended) {
              onFinish();
            } else {
              data.on('end', onFinish);
              data.on('finish', onFinish);
              data.on('close', onFinish);
              data.on('error', () => resolve());
            }
          } else {
            resolve();
          }
        });
        const buf = Buffer.concat(chunks);
        const u8 = new Uint8Array(buf.byteLength);
        u8.set(buf);
        this.files[name] = u8;
      };
      this.pending.push(processStream());
    } else {
      this.files[name] = fflate.strToU8(String(data || ''));
    }
  }

  file(name: string, data: any, options: Record<string, any> = {}): void {
    this.append(data, { name, ...options });
  }

  generateSync(): Buffer {
    let level = 6;
    if (this.options.compression === 'STORE') {
      level = 0;
    } else if (this.options.compressionOptions?.level !== undefined) {
      level = this.options.compressionOptions.level;
    } else if (this.options.compressionLevel !== undefined) {
      level = this.options.compressionLevel;
    }
    const zipped = fflate.zipSync(this.files, { level: level as fflate.DeflateOptions['level'] });
    return Buffer.from(zipped);
  }

  async generateAsync(_options: Record<string, any> = {}): Promise<Buffer> {
    if (this.pending.length > 0) {
      await Promise.all(this.pending);
    }
    return this.generateSync();
  }
}

export const JSZip = ZipReader;
export default { ZipReader, ZipWriter, JSZip };
