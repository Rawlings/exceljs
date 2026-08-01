declare const ColorXform: any;
declare const BooleanXform: any;
declare const IntegerXform: any;
declare const StringXform: any;
declare const UnderlineXform: any;
declare const _: any;
declare const BaseXform: any;
declare class FontXform extends BaseXform {
    constructor(options: any);
    get tag(): any;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): any;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
