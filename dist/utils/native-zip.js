"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeZipWriter = exports.NativeZipReader = void 0;
const node_zlib_1 = __importDefault(require("node:zlib"));
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c;
}
function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
}
class NativeZipReader {
    constructor(buffer) {
        this.files = {};
        if (buffer) {
            this.parse(buffer);
        }
    }
    parse(buf) {
        let eocdOffset = -1;
        for (let i = buf.length - 22; i >= 0; i--) {
            if (buf.readUInt32LE(i) === 0x06054b50) {
                eocdOffset = i;
                break;
            }
        }
        if (eocdOffset === -1)
            return;
        const cdCount = buf.readUInt16LE(eocdOffset + 10);
        const cdOffset = buf.readUInt32LE(eocdOffset + 16);
        let offset = cdOffset;
        for (let i = 0; i < cdCount; i++) {
            if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50)
                break;
            const compression = buf.readUInt16LE(offset + 10);
            const compSize = buf.readUInt32LE(offset + 20);
            const fileNameLen = buf.readUInt16LE(offset + 28);
            const extraLen = buf.readUInt16LE(offset + 30);
            const commentLen = buf.readUInt16LE(offset + 32);
            const localHeaderOffset = buf.readUInt32LE(offset + 42);
            const fileName = buf.toString('utf8', offset + 46, offset + 46 + fileNameLen);
            offset += 46 + fileNameLen + extraLen + commentLen;
            if (localHeaderOffset + 30 > buf.length)
                continue;
            const localFileNameLen = buf.readUInt16LE(localHeaderOffset + 26);
            const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
            const dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
            const compressedData = buf.subarray(dataOffset, dataOffset + compSize);
            let content;
            if (compression === 8) {
                content = node_zlib_1.default.inflateRawSync(compressedData);
            }
            else {
                content = compressedData;
            }
            this.files[fileName] = {
                name: fileName,
                dir: fileName.endsWith('/'),
                async: async (type) => {
                    if (type === 'string' || type === 'utf8')
                        return content.toString('utf8');
                    return content;
                },
                buffer: content,
            };
        }
    }
    static async loadAsync(input) {
        let buf;
        if (Buffer.isBuffer(input)) {
            buf = input;
        }
        else if (input instanceof ArrayBuffer) {
            buf = Buffer.from(input);
        }
        else if (typeof input === 'object' &&
            input !== null &&
            (typeof input.read === 'function' || Symbol.asyncIterator in input)) {
            const chunks = [];
            for await (const chunk of input) {
                chunks.push(chunk);
            }
            buf = Buffer.concat(chunks);
        }
        else {
            buf = Buffer.from(input);
        }
        return new NativeZipReader(buf);
    }
    file(name, data, _options = {}) {
        this.files[name] = {
            name,
            async: async () => data,
        };
        return this;
    }
    async generateAsync(_options = {}) {
        const writer = new NativeZipWriter();
        for (const [name, file] of Object.entries(this.files)) {
            const data = await file.async('nodebuffer');
            writer.append(data, { name });
        }
        return writer.generateSync();
    }
}
exports.NativeZipReader = NativeZipReader;
class NativeZipWriter {
    constructor(_options = {}) {
        this.entries = [];
    }
    append(data, options = {}) {
        const name = typeof options === 'string' ? options : options && options.name ? options.name : 'file';
        let buf;
        if (Buffer.isBuffer(data)) {
            buf = data;
        }
        else if (typeof data === 'string') {
            buf = Buffer.from(data, options && options.base64 ? 'base64' : 'utf8');
        }
        else {
            buf = Buffer.from(data || '');
        }
        this.entries.push({ name, data: buf });
    }
    file(name, data, options = {}) {
        this.append(data, { name, ...options });
    }
    generateSync() {
        const localHeaders = [];
        const cdEntries = [];
        let offset = 0;
        for (const entry of this.entries) {
            const nameBuf = Buffer.from(entry.name, 'utf8');
            const compressed = node_zlib_1.default.deflateRawSync(entry.data);
            const crc = crc32(entry.data);
            const lh = Buffer.alloc(30 + nameBuf.length);
            lh.writeUInt32LE(0x04034b50, 0);
            lh.writeUInt16LE(20, 4);
            lh.writeUInt16LE(0, 6);
            lh.writeUInt16LE(8, 8);
            lh.writeUInt16LE(0, 10);
            lh.writeUInt16LE(0, 12);
            lh.writeUInt32LE(crc, 14);
            lh.writeUInt32LE(compressed.length, 18);
            lh.writeUInt32LE(entry.data.length, 22);
            lh.writeUInt16LE(nameBuf.length, 26);
            lh.writeUInt16LE(0, 28);
            nameBuf.copy(lh, 30);
            const localOffset = offset;
            localHeaders.push(lh, compressed);
            offset += lh.length + compressed.length;
            const cd = Buffer.alloc(46 + nameBuf.length);
            cd.writeUInt32LE(0x02014b50, 0);
            cd.writeUInt16LE(20, 4);
            cd.writeUInt16LE(20, 6);
            cd.writeUInt16LE(0, 8);
            cd.writeUInt16LE(8, 10);
            cd.writeUInt16LE(0, 12);
            cd.writeUInt16LE(0, 14);
            cd.writeUInt32LE(crc, 16);
            cd.writeUInt32LE(compressed.length, 20);
            cd.writeUInt32LE(entry.data.length, 24);
            cd.writeUInt16LE(nameBuf.length, 28);
            cd.writeUInt16LE(0, 30);
            cd.writeUInt16LE(0, 32);
            cd.writeUInt16LE(0, 34);
            cd.writeUInt16LE(0, 36);
            cd.writeUInt32LE(0, 38);
            cd.writeUInt32LE(localOffset, 42);
            nameBuf.copy(cd, 46);
            cdEntries.push(cd);
        }
        const cdStart = offset;
        let cdSize = 0;
        for (const cd of cdEntries) {
            cdSize += cd.length;
        }
        const eocd = Buffer.alloc(22);
        eocd.writeUInt32LE(0x06054b50, 0);
        eocd.writeUInt16LE(0, 4);
        eocd.writeUInt16LE(0, 6);
        eocd.writeUInt16LE(this.entries.length, 8);
        eocd.writeUInt16LE(this.entries.length, 10);
        eocd.writeUInt32LE(cdSize, 12);
        eocd.writeUInt32LE(cdStart, 16);
        eocd.writeUInt16LE(0, 20);
        return Buffer.concat([...localHeaders, ...cdEntries, eocd]);
    }
    async generateAsync(_options = {}) {
        return this.generateSync();
    }
}
exports.NativeZipWriter = NativeZipWriter;
exports.default = {
    NativeZipReader,
    NativeZipWriter,
    JSZip: NativeZipReader,
};
