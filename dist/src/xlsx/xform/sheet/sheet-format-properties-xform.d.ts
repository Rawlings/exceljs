declare const _: any;
declare const BaseXform: any;
declare class SheetFormatPropertiesXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
