declare const utils: any;
declare const BaseXform: any;
declare class WorksheetXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
