declare const fs: any;
declare const EventEmitter: any;
declare const PassThrough: any, Readable: any;
declare const JSZip: any;
declare const iterateStream: any;
declare const parseSax: any;
declare const StyleManager: any;
declare const WorkbookXform: any;
declare const RelationshipsXform: any;
declare const WorksheetReader: any;
declare const HyperlinkReader: any;
declare class WorkbookReader extends EventEmitter {
    constructor(input: any, options?: {});
    _getStream(input: any): any;
    read(input: any, options: any): Promise<void>;
    [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown>;
    parse(input: any, options: any): AsyncGenerator<{
        index: number;
        text: any;
    } | {
        eventType: string;
        value: any;
    }, void, unknown>;
    _emitEntry(payload: any): void;
    _parseRels(entry: any): Promise<void>;
    _parseWorkbook(entry: any): Promise<void>;
    _parseSharedStrings(entry: any): AsyncGenerator<{
        index: number;
        text: any;
    }, void, unknown>;
    _parseStyles(entry: any): Promise<void>;
    _parseWorksheet(iterator: any, sheetNo: any): Generator<{
        eventType: string;
        value: any;
    }, void, unknown>;
    _parseHyperlinks(iterator: any, sheetNo: any): Generator<{
        eventType: string;
        value: any;
    }, void, unknown>;
}
