declare const XmlStream: any;
declare const BaseXform: any;
declare const RelationshipXform: any;
declare class RelationshipsXform extends BaseXform {
    constructor();
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
