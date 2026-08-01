"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZipWriter = void 0;
const events_1 = __importDefault(require("events"));
const native_zip_1 = require("./native-zip");
const stream_buf_1 = __importDefault(require("./stream-buf"));
// =============================================================================
// The ZipWriter class
// Packs streamed data into an output zip stream
class ZipWriter extends events_1.default.EventEmitter {
    constructor(options) {
        super();
        this.options = Object.assign({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        }, options);
        this.zip = new native_zip_1.NativeZipWriter();
        this.stream = new stream_buf_1.default();
    }
    append(data, options) {
        if (options.hasOwnProperty('base64') && options.base64) {
            this.zip.file(options.name, data, { base64: true });
        }
        else {
            this.zip.file(options.name, data);
        }
    }
    async finalize() {
        const content = await this.zip.generateAsync(this.options);
        this.stream.end(content);
        this.emit('finish');
    }
    // ==========================================================================
    // Stream.Readable interface
    read(size) {
        return this.stream.read(size);
    }
    setEncoding(encoding) {
        return this.stream.setEncoding(encoding);
    }
    pause() {
        return this.stream.pause();
    }
    resume() {
        return this.stream.resume();
    }
    isPaused() {
        return this.stream.isPaused();
    }
    pipe(destination, options) {
        return this.stream.pipe(destination, options);
    }
    unpipe(destination) {
        return this.stream.unpipe(destination);
    }
    unshift(chunk) {
        return this.stream.unshift(chunk);
    }
    wrap(stream) {
        return this.stream.wrap(stream);
    }
}
exports.ZipWriter = ZipWriter;
exports.default = {
    ZipWriter,
};
