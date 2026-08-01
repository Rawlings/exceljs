declare const BaseXform: any;
declare class AppTitlesOfPartsXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
