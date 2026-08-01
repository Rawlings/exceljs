declare const BaseXform: any;
declare class ListXform extends BaseXform {
    constructor(options: any);
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
