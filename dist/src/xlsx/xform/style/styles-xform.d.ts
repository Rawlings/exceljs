declare const Enums: any;
declare const XmlStream: any;
declare const BaseXform: any;
declare const StaticXform: any;
declare const ListXform: any;
declare const FontXform: any;
declare const FillXform: any;
declare const BorderXform: any;
declare const NumFmtXform: any;
declare const StyleXform: any;
declare const DxfXform: any;
declare const NUMFMT_BASE = 164;
declare class StylesXform extends BaseXform {
    constructor(initialise: any);
    initIndex(): void;
    init(): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    addStyleModel(model: any, cellType: any): any;
    getStyleModel(id: any): any;
    addDxfStyle(style: any): number;
    getDxfStyle(id: any): any;
    _addStyle(style: any): any;
    _addNumFmtStr(formatCode: any): any;
    _addFont(font: any): any;
    _addBorder(border: any): any;
    _addFill(fill: any): any;
}
declare class StylesXformMock extends StylesXform {
    constructor();
    parseStream(stream: any): Promise<void>;
    addStyleModel(model: any, cellType: any): any;
    get dateStyleId(): any;
    getStyleModel(): {};
}
