declare const BaseXform: any;
declare class WorksheetPropertiesXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
