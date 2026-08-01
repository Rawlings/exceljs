import { EventEmitter } from 'events';
declare class HyperlinkReader extends EventEmitter {
    workbook: any;
    id: any;
    iterator: any;
    options: any;
    hyperlinks: any;
    constructor({ workbook, id, iterator, options }?: any);
    get count(): any;
    each(fn: any): any;
    read(): Promise<void>;
}
export default HyperlinkReader;
