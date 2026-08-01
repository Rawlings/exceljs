declare const colCache: any;
declare const XmlStream: any;
declare const BaseXform: any;
declare const TwoCellAnchorXform: any;
declare const OneCellAnchorXform: any;
declare function getAnchorType(model: any): "xdr:oneCellAnchor" | "xdr:twoCellAnchor";
declare class DrawingXform extends BaseXform {
    constructor();
    prepare(model: any): void;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
