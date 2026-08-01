import { EventEmitter } from 'events';
import Row from '../../doc/row';
declare class WorksheetReader extends EventEmitter {
    workbook: any;
    id: any;
    iterator: any;
    options: any;
    name: string;
    _columns: any;
    _keys: any;
    _dimensions: any;
    constructor({ workbook, id, iterator, options }?: any);
    destroy(): void;
    get dimensions(): any;
    get columns(): any;
    getColumn(c: any): any;
    getColumnKey(key: any): any;
    setColumnKey(key: any, value: any): void;
    deleteColumnKey(key: any): void;
    eachColumnKey(f: any): void;
    read(): Promise<void>;
    [Symbol.asyncIterator](): AsyncGenerator<Row | {
        ref: any;
        rId: any;
    } | null, void, unknown>;
    parse(): AsyncGenerator<({
        eventType: string;
        value: {
            ref: any;
            rId: any;
        };
    } | {
        eventType: string;
        value: Row | null;
    })[], void, unknown>;
}
export default WorksheetReader;
