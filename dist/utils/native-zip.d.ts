declare class NativeZipReader {
    constructor(buffer: any);
    parse(buf: any): void;
    static loadAsync(input: any): Promise<NativeZipReader>;
    file(name: any, data: any, _options?: any): this;
    generateAsync(_options?: any): Promise<any>;
}
declare class NativeZipWriter {
    constructor(_options?: any);
    append(data: any, options?: any): void;
    file(name: any, data: any, options?: any): void;
    generateSync(): any;
    generateAsync(_options?: any): Promise<any>;
}
export { NativeZipReader, NativeZipWriter, JSZip as NativeZipReader };
declare const _default: {
    NativeZipReader: typeof NativeZipReader;
    NativeZipWriter: typeof NativeZipWriter;
    JSZip: typeof NativeZipReader;
};
export default _default;
