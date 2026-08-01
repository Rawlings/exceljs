declare const XmlStream: any;
declare const BaseXform: any;
declare const VmlShapeXform: any;
declare class VmlNotesXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
