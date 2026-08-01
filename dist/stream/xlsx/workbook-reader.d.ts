import { EventEmitter } from 'events';
import WorksheetReader from './worksheet-reader';
import HyperlinkReader from './hyperlink-reader';
declare class WorkbookReader extends EventEmitter {
    input: any;
    options: any;
    styles: any;
    stream: any;
    constructor(input?: any, options?: any);
    _getStream(input: any): any;
    read(input: any, options: any): Promise<void>;
    [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown>;
    parse(input: any, options: any): AsyncGenerator<{
        index: number;
        text: any;
    } | {
        eventType: string;
        value: WorksheetReader;
    } | {
        eventType: string;
        value: HyperlinkReader;
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
        value: WorksheetReader;
    }, void, unknown>;
    _parseHyperlinks(iterator: any, sheetNo: any): Generator<{
        eventType: string;
        value: HyperlinkReader;
    }, void, unknown>;
}
export default WorkbookReader;
