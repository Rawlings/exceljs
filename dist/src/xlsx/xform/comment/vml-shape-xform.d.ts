declare const BaseXform: any;
declare const VmlTextboxXform: any;
declare const VmlClientDataXform: any;
declare class VmlShapeXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any, index: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
