import BaseXform from '../base-xform';
declare class TableXform extends BaseXform {
    static TABLE_ATTRIBUTES: any;
    constructor();
    prepare(model: any, options: any): void;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
export default TableXform;
