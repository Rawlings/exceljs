"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = __importDefault(require("stream"));
// =============================================================================
// StreamBase64 - A utility to convert to/from base64 stream
// Note: does not buffer data, must be piped
class StreamBase64 extends stream_1.default.Duplex {
    constructor() {
        super();
        // consuming pipe streams go here
        this.pipes = [];
    }
    // writable
    // event drain - if write returns false (which it won't), indicates when safe to write again.
    // finish - end() has been called
    // pipe(src) - pipe() has been called on readable
    // unpipe(src) - unpipe() has been called on readable
    // error - duh
    write() {
        return true;
    }
    cork() { }
    uncork() { }
    end() { }
    // readable
    // event readable - some data is now available
    // event data - switch to flowing mode - feeds chunks to handler
    // event end - no more data
    // event close - optional, indicates upstream close
    // event error - duh
    read() { }
    setEncoding(encoding) {
        // causes stream.read or stream.on('data) to return strings of encoding instead of Buffer objects
        this.encoding = encoding;
    }
    pause() { }
    resume() { }
    isPaused() { }
    pipe(destination) {
        // add destination to pipe list & write current buffer
        this.pipes.push(destination);
    }
    unpipe(destination) {
        // remove destination from pipe list
        this.pipes = this.pipes.filter((pipe) => pipe !== destination);
    }
    unshift() {
        // some numpty has read some data that's not for them and they want to put it back!
        // Might implement this some day
        throw new Error('Not Implemented');
    }
    wrap() {
        // not implemented
        throw new Error('Not Implemented');
    }
}
exports.default = StreamBase64;
