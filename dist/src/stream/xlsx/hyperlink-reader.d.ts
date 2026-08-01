declare const EventEmitter: any;
declare const parseSax: any;
declare const Enums: any;
declare const RelType: any;
declare class HyperlinkReader extends EventEmitter {
    constructor({ workbook, id, iterator, options }: {
        id: any;
        iterator: any;
        options: any;
        workbook: any;
    });
    get count(): any;
    each(fn: any): any;
    read(): Promise<void>;
}
