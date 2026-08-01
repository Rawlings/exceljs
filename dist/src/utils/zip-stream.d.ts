declare const events: any;
declare const JSZip: any;
declare const StreamBuf: any;
declare const stringToBuffer: any;
declare class ZipWriter extends events.EventEmitter {
    constructor(options: any);
    append(data: any, options: any): void;
    finalize(): Promise<void>;
    read(size: any): any;
    setEncoding(encoding: any): any;
    pause(): any;
    resume(): any;
    isPaused(): any;
    pipe(destination: any, options: any): any;
    unpipe(destination: any): any;
    unshift(chunk: any): any;
    wrap(stream: any): any;
}
