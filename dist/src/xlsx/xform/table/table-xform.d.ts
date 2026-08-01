declare const XmlStream: any;
declare const BaseXform: any;
declare const ListXform: any;
declare const AutoFilterXform: any;
declare const TableColumnXform: any;
declare const TableStyleInfoXform: any;
declare class TableXform extends BaseXform {
    constructor();
    prepare(model: any, options: any): void;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
