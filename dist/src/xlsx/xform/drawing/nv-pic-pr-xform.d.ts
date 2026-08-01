declare const BaseXform: any;
declare const CNvPrXform: any;
declare const CNvPicPrXform: any;
declare class NvPicPrXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
