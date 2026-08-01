declare const TextXform: any;
declare const RichTextXform: any;
declare const BaseXform: any;
declare class PhoneticTextXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
