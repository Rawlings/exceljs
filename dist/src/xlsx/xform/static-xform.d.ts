declare const BaseXform: any;
declare const XmlStream: any;
declare function build(xmlStream: any, model: any): void;
declare class StaticXform extends BaseXform {
    constructor(model: any);
    render(xmlStream: any): void;
    parseOpen(): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
