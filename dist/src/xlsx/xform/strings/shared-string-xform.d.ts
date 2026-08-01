declare const TextXform: any;
declare const RichTextXform: any;
declare const PhoneticTextXform: any;
declare const BaseXform: any;
declare class SharedStringXform extends BaseXform {
    constructor(model: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
