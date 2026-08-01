import BaseXform from '../base-xform';
declare class StylesXform extends BaseXform {
    static Mock: any;
    static STYLESHEET_ATTRIBUTES: any;
    static STATIC_XFORMS: any;
    _dateStyleId: any;
    index: any;
    constructor(initialise?: any);
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
export default StylesXform;
