declare const BaseXform: any;
declare const StaticXform: any;
declare const BlipFillXform: any;
declare const NvPicPrXform: any;
declare const spPrJSON: any;
declare class PicXform extends BaseXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
