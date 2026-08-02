import * as fflate from 'fflate';

export function toU8(data: Uint8Array | ArrayBuffer | Buffer | string): Uint8Array {
  if (typeof data === 'string') {
    return fflate.strToU8(data);
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  const clean = new Uint8Array(data.byteLength);
  clean.set(data);
  return clean;
}

export function unzip(input: Uint8Array | Buffer | ArrayBuffer): Record<string, Buffer> {
  const u8 = toU8(input);
  const unzipped = fflate.unzipSync(u8);
  const result: Record<string, Buffer> = {};
  for (const [path, content] of Object.entries(unzipped)) {
    result[path.replace(/^\//, '')] = Buffer.from(content);
  }
  return result;
}

export class ZipBuilder {
  private files: Record<string, Uint8Array> = {};
  private pending: Promise<void>[] = [];

  constructor(private options: Record<string, unknown> = {}) {}

  append(data: unknown, options: { name?: string; base64?: boolean } | string = {}): void {
    const rawName = typeof options === 'string' ? options : options.name || 'file';
    const name = rawName.replace(/^\//, '');
    const isBase64 = typeof options === 'object' && options?.base64;
    const d = data as Record<string, unknown>;

    if (Buffer.isBuffer(data) || data instanceof Uint8Array || data instanceof ArrayBuffer) {
      this.files[name] = toU8(data);
    } else if (typeof data === 'string') {
      this.files[name] = isBase64 ? toU8(Buffer.from(data, 'base64')) : toU8(data);
    } else if (data && typeof d.xml === 'string') {
      this.files[name] = toU8(d.xml as string);
    } else if (data && typeof d.toXml === 'function') {
      this.files[name] = toU8((d.toXml as () => string)());
    } else if (data && typeof d.toBuffer === 'function') {
      const buf = (d.toBuffer as () => unknown)();
      this.files[name] = toU8(buf as Uint8Array | string);
    } else if (data && typeof data === 'object' && 'then' in data) {
      this.pending.push(
        (data as Promise<unknown>).then((resolved) => {
          this.files[name] = toU8(resolved as Uint8Array | string);
        })
      );
    } else {
      this.files[name] = toU8(String(data || ''));
    }
  }

  file(name: string, data: unknown, options: Record<string, unknown> = {}): void {
    this.append(data, { name, ...options });
  }

  generateSync(): Buffer {
    let level: fflate.DeflateOptions['level'] = 6;
    const compressionOptions = this.options.compressionOptions as { level?: number } | undefined;
    if (this.options.compression === 'STORE') {
      level = 0;
    } else if (compressionOptions?.level !== undefined) {
      level = compressionOptions.level as fflate.DeflateOptions['level'];
    } else if (this.options.compressionLevel !== undefined) {
      level = this.options.compressionLevel as fflate.DeflateOptions['level'];
    }
    return Buffer.from(fflate.zipSync(this.files, { level }));
  }

  async generateAsync(): Promise<Buffer> {
    if (this.pending.length > 0) {
      await Promise.all(this.pending);
    }
    return this.generateSync();
  }
}

export { ZipBuilder as ZipWriter };
export default { unzip, ZipBuilder, ZipWriter: ZipBuilder };
