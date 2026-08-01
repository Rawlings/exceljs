declare const BaseXform: any;
declare const ColorXform: any;
declare const PageSetupPropertiesXform: any;
declare const OutlinePropertiesXform: any;
declare class SheetPropertiesXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): boolean;
    parseClose(name: any): boolean;
}
