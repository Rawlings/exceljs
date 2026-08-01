declare const BaseXform: any;
declare const FilterColumnXform: any;
declare class AutoFilterXform extends BaseXform {
    constructor();
    get tag(): string;
    prepare(model: any): void;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
