"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const events_1 = require("events");
const stream_1 = require("stream");
const native_zip_1 = require("../../utils/native-zip");
const iterate_stream_1 = __importDefault(require("../../utils/iterate-stream"));
const parse_sax_1 = __importDefault(require("../../utils/parse-sax"));
const styles_xform_1 = __importDefault(require("../../xlsx/xform/style/styles-xform"));
const workbook_xform_1 = __importDefault(require("../../xlsx/xform/book/workbook-xform"));
const relationships_xform_1 = __importDefault(require("../../xlsx/xform/core/relationships-xform"));
const worksheet_reader_1 = __importDefault(require("./worksheet-reader"));
const hyperlink_reader_1 = __importDefault(require("./hyperlink-reader"));
class WorkbookReader extends events_1.EventEmitter {
    input;
    options;
    styles;
    stream;
    constructor(input, options = {}) {
        super();
        this.input = input;
        this.options = {
            worksheets: 'emit',
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            styles: 'ignore',
            entries: 'ignore',
            ...options,
        };
        this.styles = new styles_xform_1.default();
        this.styles.init();
    }
    _getStream(input) {
        if (input instanceof stream_1.Readable) {
            return input;
        }
        if (typeof input === 'string') {
            return fs_1.default.createReadStream(input);
        }
        throw new Error(`Could not recognise input: ${input}`);
    }
    async read(input, options) {
        try {
            for await (const { eventType, value } of this.parse(input, options)) {
                switch (eventType) {
                    case 'shared-strings':
                        this.emit(eventType, value);
                        break;
                    case 'worksheet':
                        this.emit(eventType, value);
                        await value.read();
                        break;
                    case 'hyperlinks':
                        this.emit(eventType, value);
                        break;
                }
            }
            this.emit('end');
            this.emit('finished');
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    async *[Symbol.asyncIterator]() {
        for await (const { eventType, value } of this.parse()) {
            if (eventType === 'worksheet') {
                yield value;
            }
        }
    }
    async *parse(input, options) {
        if (options)
            this.options = options;
        const stream = (this.stream = this._getStream(input || this.input));
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const zip = await native_zip_1.NativeZipReader.loadAsync(Buffer.concat(chunks));
        const entries = [];
        for (const [path, file] of Object.entries(zip.files)) {
            if (file.dir)
                continue;
            const buf = await file.async('nodebuffer');
            const entry = stream_1.Readable.from(buf);
            entry.path = path;
            entries.push(entry);
        }
        for (const entry of entries) {
            let match;
            let sheetNo;
            switch (entry.path) {
                case '_rels/.rels':
                    break;
                case 'xl/_rels/workbook.xml.rels':
                    await this._parseRels(entry);
                    break;
                case 'xl/workbook.xml':
                    await this._parseWorkbook(entry);
                    break;
                case 'xl/sharedStrings.xml':
                    yield* this._parseSharedStrings(entry);
                    break;
                case 'xl/styles.xml':
                    await this._parseStyles(entry);
                    break;
                default:
                    if (entry.path.match(/xl\/worksheets\/sheet\d+[.]xml/)) {
                        match = entry.path.match(/xl\/worksheets\/sheet(\d+)[.]xml/);
                        sheetNo = match[1];
                        if (this.sharedStrings && this.workbookRels) {
                            yield* this._parseWorksheet((0, iterate_stream_1.default)(entry), sheetNo);
                        }
                        else {
                            // create temp file for each worksheet
                            await new Promise((resolve, reject) => {
                                tmp.file((err, path, fd, tempFileCleanupCallback) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    waitingWorkSheets.push({ sheetNo, path, tempFileCleanupCallback });
                                    const tempStream = fs_1.default.createWriteStream(path);
                                    tempStream.on('error', reject);
                                    entry.pipe(tempStream);
                                    return tempStream.on('finish', () => {
                                        return resolve();
                                    });
                                });
                            });
                        }
                    }
                    else if (entry.path.match(/xl\/worksheets\/_rels\/sheet\d+[.]xml.rels/)) {
                        match = entry.path.match(/xl\/worksheets\/_rels\/sheet(\d+)[.]xml.rels/);
                        sheetNo = match[1];
                        yield* this._parseHyperlinks((0, iterate_stream_1.default)(entry), sheetNo);
                    }
                    break;
            }
            entry.autodrain();
        }
        for (const { sheetNo, path, tempFileCleanupCallback } of waitingWorkSheets) {
            let fileStream = fs_1.default.createReadStream(path);
            // TODO: Remove once node v8 is deprecated
            // Detect and upgrade old fileStreams
            if (!fileStream[Symbol.asyncIterator]) {
                fileStream = fileStream.pipe(new stream_1.PassThrough());
            }
            yield* this._parseWorksheet(fileStream, sheetNo);
            tempFileCleanupCallback();
        }
    }
    _emitEntry(payload) {
        if (this.options.entries === 'emit') {
            this.emit('entry', payload);
        }
    }
    async _parseRels(entry) {
        const xform = new relationships_xform_1.default();
        this.workbookRels = await xform.parseStream((0, iterate_stream_1.default)(entry));
    }
    async _parseWorkbook(entry) {
        this._emitEntry({ type: 'workbook' });
        const workbook = new workbook_xform_1.default();
        await workbook.parseStream((0, iterate_stream_1.default)(entry));
        this.properties = workbook.map.workbookPr;
        this.model = workbook.model;
    }
    async *_parseSharedStrings(entry) {
        this._emitEntry({ type: 'shared-strings' });
        switch (this.options.sharedStrings) {
            case 'cache':
                this.sharedStrings = [];
                break;
            case 'emit':
                break;
            default:
                return;
        }
        let text = null;
        let richText = [];
        let index = 0;
        let font = null;
        for await (const events of (0, parse_sax_1.default)((0, iterate_stream_1.default)(entry))) {
            for (const { eventType, value } of events) {
                if (eventType === 'opentag') {
                    const node = value;
                    switch (node.name) {
                        case 'b':
                            font = font || {};
                            font.bold = true;
                            break;
                        case 'charset':
                            font = font || {};
                            font.charset = parseInt(node.attributes.charset, 10);
                            break;
                        case 'color':
                            font = font || {};
                            font.color = {};
                            if (node.attributes.rgb) {
                                font.color.argb = node.attributes.argb;
                            }
                            if (node.attributes.val) {
                                font.color.argb = node.attributes.val;
                            }
                            if (node.attributes.theme) {
                                font.color.theme = node.attributes.theme;
                            }
                            break;
                        case 'family':
                            font = font || {};
                            font.family = parseInt(node.attributes.val, 10);
                            break;
                        case 'i':
                            font = font || {};
                            font.italic = true;
                            break;
                        case 'outline':
                            font = font || {};
                            font.outline = true;
                            break;
                        case 'rFont':
                            font = font || {};
                            font.name = node.value;
                            break;
                        case 'si':
                            font = null;
                            richText = [];
                            text = null;
                            break;
                        case 'sz':
                            font = font || {};
                            font.size = parseInt(node.attributes.val, 10);
                            break;
                        case 'strike':
                            break;
                        case 't':
                            text = null;
                            break;
                        case 'u':
                            font = font || {};
                            font.underline = true;
                            break;
                        case 'vertAlign':
                            font = font || {};
                            font.vertAlign = node.attributes.val;
                            break;
                    }
                }
                else if (eventType === 'text') {
                    text = text ? text + value : value;
                }
                else if (eventType === 'closetag') {
                    const node = value;
                    switch (node.name) {
                        case 'r':
                            richText.push({
                                font,
                                text,
                            });
                            font = null;
                            text = null;
                            break;
                        case 'si':
                            if (this.options.sharedStrings === 'cache') {
                                this.sharedStrings.push(richText.length ? { richText } : text);
                            }
                            else if (this.options.sharedStrings === 'emit') {
                                yield { index: index++, text: richText.length ? { richText } : text };
                            }
                            richText = [];
                            font = null;
                            text = null;
                            break;
                    }
                }
            }
        }
    }
    async _parseStyles(entry) {
        this._emitEntry({ type: 'styles' });
        if (this.options.styles === 'cache') {
            this.styles = new styles_xform_1.default();
            await this.styles.parseStream((0, iterate_stream_1.default)(entry));
        }
    }
    *_parseWorksheet(iterator, sheetNo) {
        this._emitEntry({ type: 'worksheet', id: sheetNo });
        const worksheetReader = new worksheet_reader_1.default({
            workbook: this,
            id: sheetNo,
            iterator,
            options: this.options,
        });
        const matchingRel = (this.workbookRels || []).find((rel) => rel.Target === `worksheets/sheet${sheetNo}.xml`);
        const matchingSheet = matchingRel && (this.model.sheets || []).find((sheet) => sheet.rId === matchingRel.Id);
        if (matchingSheet) {
            worksheetReader.id = matchingSheet.id;
            worksheetReader.name = matchingSheet.name;
            worksheetReader.state = matchingSheet.state;
        }
        if (this.options.worksheets === 'emit') {
            yield { eventType: 'worksheet', value: worksheetReader };
        }
    }
    *_parseHyperlinks(iterator, sheetNo) {
        this._emitEntry({ type: 'hyperlinks', id: sheetNo });
        const hyperlinksReader = new hyperlink_reader_1.default({
            workbook: this,
            id: sheetNo,
            iterator,
            options: this.options,
        });
        if (this.options.hyperlinks === 'emit') {
            yield { eventType: 'hyperlinks', value: hyperlinksReader };
        }
    }
}
// for reference - these are the valid values for options
WorkbookReader.Options = {
    worksheets: ['emit', 'ignore'],
    sharedStrings: ['cache', 'emit', 'ignore'],
    hyperlinks: ['cache', 'emit', 'ignore'],
    styles: ['cache', 'ignore'],
    entries: ['emit', 'ignore'],
};
exports.default = WorkbookReader;
