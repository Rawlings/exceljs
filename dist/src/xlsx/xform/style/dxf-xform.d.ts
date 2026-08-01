declare const BaseXform: any;
declare const AlignmentXform: any;
declare const BorderXform: any;
declare const FillXform: any;
declare const FontXform: any;
declare const NumFmtXform: any;
declare const ProtectionXform: any;
declare class DxfXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
