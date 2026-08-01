declare const XmlStream: any;
declare const BaseXform: any;
declare const DateXform: any;
declare const StringXform: any;
declare const IntegerXform: any;
declare class CoreXform extends BaseXform {
    constructor();
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
