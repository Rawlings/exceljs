declare const BaseXform: any;
declare const colCache: any;
declare class DefinedNamesXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(): boolean;
}
declare function isValidRange(range: any): boolean;
declare function extractRanges(parsedText: any): any[];
