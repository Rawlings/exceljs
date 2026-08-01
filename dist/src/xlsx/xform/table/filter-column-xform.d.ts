declare const BaseXform: any;
declare const ListXform: any;
declare const CustomFilterXform: any;
declare const FilterXform: any;
declare class FilterColumnXform extends BaseXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
