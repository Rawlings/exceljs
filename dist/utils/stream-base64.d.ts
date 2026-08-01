import Stream from 'stream';
declare class StreamBase64 extends Stream.Duplex {
    constructor();
    write(): boolean;
    cork(): void;
    uncork(): void;
    end(): void;
    read(): void;
    setEncoding(encoding: any): void;
    pause(): void;
    resume(): void;
    isPaused(): void;
    pipe(destination: any): void;
    unpipe(destination: any): void;
    unshift(): void;
    wrap(): void;
}
export default StreamBase64;
