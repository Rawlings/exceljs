declare const events: any;
declare class StutteredPipe extends events.EventEmitter {
    constructor(readable: any, writable: any, options: any);
    pause(): void;
    resume(): void;
    _schedule(): void;
}
