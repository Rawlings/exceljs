import { EventEmitter } from 'node:events';

class StutteredPipe extends EventEmitter {
  readable: any;
  writable: any;
  bufSize: number;
  autoPause: boolean;
  paused: boolean;
  eod: boolean;
  scheduled: NodeJS.Timeout | null;

  constructor(
    readable: any,
    writable: any,
    options: { bufSize?: number; autoPause?: boolean } = {}
  ) {
    super();

    this.readable = readable;
    this.writable = writable;
    this.bufSize = options.bufSize || 16384;
    this.autoPause = options.autoPause || false;

    this.paused = false;
    this.eod = false;
    this.scheduled = null;

    readable.on('end', () => {
      this.eod = true;
      writable.end();
    });

    readable.on('readable', () => {
      if (!this.paused) {
        this.resume();
      }
    });

    this._schedule();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.eod) {
      if (this.scheduled !== null) {
        clearImmediate(this.scheduled as any);
      }
      this._schedule();
    }
  }

  private _schedule(): void {
    this.scheduled = setImmediate(() => {
      this.scheduled = null;
      if (!this.eod && !this.paused) {
        const data = this.readable.read(this.bufSize);
        if (data && data.length) {
          this.writable.write(data);
          if (!this.paused && !this.autoPause) {
            this._schedule();
          }
        } else if (!this.paused) {
          this._schedule();
        }
      }
    }) as unknown as NodeJS.Timeout;
  }
}

export default StutteredPipe;
