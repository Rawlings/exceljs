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
    const unzipped = fflate.unzipSync(new Uint8Array(buf));
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
      (typeof input.read === 'function' || Symbol.asyncIterator in input)
    ) {
      const chunks: Buffer[] = [];
      if (typeof input.read === 'function') {
        let chunk: any;
        while ((chunk = input.read()) !== null) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      } else {
        for await (const chunk of input) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
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

  constructor(_options: Record<string, any> = {}) {}

  append(data: any, options: { name?: string; base64?: boolean } | string = {}): void {
    const rawName = typeof options === 'string' ? options : options.name || 'file';
    const name = rawName.replace(/^\//, '');

    if (Buffer.isBuffer(data)) {
      this.files[name] = new Uint8Array(data);
    } else if (data instanceof ArrayBuffer) {
      this.files[name] = new Uint8Array(data);
    } else if (typeof data === 'string') {
      const isBase64 = typeof options === 'object' && options?.base64;
      const buf = Buffer.from(data, isBase64 ? 'base64' : 'utf8');
      this.files[name] = new Uint8Array(buf);
    } else if (data && typeof data.xml === 'string') {
      this.files[name] = fflate.strToU8(data.xml);
    } else if (data && typeof data.toXml === 'function') {
      this.files[name] = fflate.strToU8(data.toXml());
    } else if (data && typeof data.toBuffer === 'function') {
      const buf = data.toBuffer();
      if (Buffer.isBuffer(buf)) {
        this.files[name] = new Uint8Array(buf);
      } else if (typeof buf === 'string') {
        this.files[name] = fflate.strToU8(buf);
      }
    } else if (
      data &&
      (typeof data.read === 'function' ||
        typeof data.on === 'function' ||
        Symbol.asyncIterator in data)
    ) {
      const chunks: Buffer[] = [];
      const processStream = async () => {
        if (typeof data.on === 'function') {
          await new Promise<void>((resolve) => {
            data.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            const onEnd = () => {
              if (typeof data.read === 'function') {
                let chunk: any;
                while ((chunk = data.read()) !== null) {
                  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
              }
              resolve();
            };
            if (data.writableEnded || data._readableState?.ended || data._writableState?.ended) {
              onEnd();
            } else {
              data.on('end', onEnd);
              data.on('finish', onEnd);
            }
          });
        } else if (typeof data.read === 'function') {
          let chunk: any;
          while ((chunk = data.read()) !== null) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        }
        const buf = Buffer.concat(chunks);
        this.files[name] = new Uint8Array(buf);
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
    const zipped = fflate.zipSync(this.files);
    return Buffer.from(zipped.buffer, zipped.byteOffset, zipped.byteLength);
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
