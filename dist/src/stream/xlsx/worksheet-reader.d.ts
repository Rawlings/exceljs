declare const EventEmitter: any;
declare const parseSax: any;
declare const _: any;
declare const utils: any;
declare const colCache: any;
declare const Dimensions: any;
declare const Row: any;
declare const Column: any;
declare class WorksheetReader extends EventEmitter {
    constructor({ workbook, id, iterator, options }: {
        id: any;
        iterator: any;
        options: any;
        workbook: any;
    });
    destroy(): void;
    get dimensions(): any;
    get columns(): any;
    getColumn(c: any): any;
    getColumnKey(key: any): any;
    setColumnKey(key: any, value: any): void;
    deleteColumnKey(key: any): void;
    eachColumnKey(f: any): void;
    read(): Promise<void>;
    [Symbol.asyncIterator](): AsyncGenerator<any, void, unknown>;
    parse(): AsyncGenerator<any[], void, unknown>;
}
