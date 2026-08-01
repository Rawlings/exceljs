declare const zlib: any;
declare const crcTable: Uint32Array<ArrayBuffer>;
declare function crc32(buf: any): number;
declare class NativeZipReader {
    constructor(buffer: any);
    parse(buf: any): void;
    static loadAsync(input: any): Promise<NativeZipReader>;
    file(name: any, data: any, _options?: {}): this;
    generateAsync(_options?: {}): Promise<any>;
}
declare class NativeZipWriter {
    constructor(_options?: {});
    append(data: any, options?: {}): void;
    file(name: any, data: any, options?: {}): void;
    generateSync(): any;
    generateAsync(_options?: {}): Promise<any>;
}
