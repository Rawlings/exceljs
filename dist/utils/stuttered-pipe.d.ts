import events from 'events';
declare class StutteredPipe extends events.EventEmitter {
    constructor(readable: any, writable: any, options: any);
    pause(): void;
    resume(): void;
    _schedule(): void;
}
export default StutteredPipe;
