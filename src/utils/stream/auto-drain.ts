import { EventEmitter } from 'node:events';

class AutoDrain extends EventEmitter {
  write(chunk: any): void {
    this.emit('data', chunk);
  }

  end(): void {
    this.emit('end');
  }
}

export default AutoDrain;
