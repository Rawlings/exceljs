declare const BaseXform: any;
declare const utils: any;
declare const CellXform: any;
declare class RowXform extends BaseXform {
    constructor(options: any);
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any, options: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
