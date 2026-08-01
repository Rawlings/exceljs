import { EventEmitter } from 'events';

// =============================================================================
// AutoDrain - kind of /dev/null
class AutoDrain extends EventEmitter {
  write(chunk: any) {
    this.emit('data', chunk);
  }

  end() {
    this.emit('end');
  }
}

export default AutoDrain;
