declare const EventEmitter: any;
declare class AutoDrain extends EventEmitter {
    write(chunk: any): void;
    end(): void;
}
