declare const Stream: any;
declare const utils: any;
declare const StringBuf: any;
declare class StringChunk {
    constructor(data: any, encoding: any);
    get length(): any;
    copy(target: any, targetOffset: any, offset: any, length: any): any;
    toBuffer(): any;
}
declare class StringBufChunk {
    constructor(data: any);
    get length(): any;
    copy(target: any, targetOffset: any, offset: any, length: any): any;
    toBuffer(): any;
}
declare class BufferChunk {
    constructor(data: any);
    get length(): any;
    copy(target: any, targetOffset: any, offset: any, length: any): void;
    toBuffer(): any;
}
declare class ReadWriteBuf {
    constructor(size: any);
    toBuffer(): any;
    get length(): number;
    get eod(): boolean;
    get full(): boolean;
    read(size: any): any;
    write(chunk: any, offset: any, length: any): number;
}
declare const StreamBuf: (options: any) => void;
