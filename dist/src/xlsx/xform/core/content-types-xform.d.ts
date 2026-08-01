declare const XmlStream: any;
declare const BaseXform: any;
declare class ContentTypesXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(): boolean;
    parseText(): void;
    parseClose(): boolean;
}
