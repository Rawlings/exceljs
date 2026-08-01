import { EventEmitter } from 'events';
declare class AutoDrain extends EventEmitter {
    write(chunk: any): void;
    end(): void;
}
export default AutoDrain;
