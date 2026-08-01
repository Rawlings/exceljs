declare const BaseXform: any;
declare class PageSetupPropertiesXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
