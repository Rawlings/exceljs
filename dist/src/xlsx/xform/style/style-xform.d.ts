declare const BaseXform: any;
declare const AlignmentXform: any;
declare const ProtectionXform: any;
declare class StyleXform extends BaseXform {
    constructor(options: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
