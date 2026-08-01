declare const XmlStream: any;
declare const BaseXform: any;
declare const StringXform: any;
declare const AppHeadingPairsXform: any;
declare const AppTitleOfPartsXform: any;
declare class AppXform extends BaseXform {
    constructor();
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
