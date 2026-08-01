declare const BaseXform: any;
declare const utils: any;
declare const ColorXform: any;
declare class EdgeXform extends BaseXform {
    constructor(name: any);
    get tag(): any;
    render(xmlStream: any, model: any, defaultColor: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    validStyle(value: any): any;
}
declare class BorderXform extends BaseXform {
    constructor();
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
