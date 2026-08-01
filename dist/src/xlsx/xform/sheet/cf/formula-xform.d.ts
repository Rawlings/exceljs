declare const BaseXform: any;
declare class FormulaXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(): void;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
