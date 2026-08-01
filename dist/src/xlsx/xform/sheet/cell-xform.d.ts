declare const utils: any;
declare const BaseXform: any;
declare const Range: any;
declare const Enums: any;
declare const RichTextXform: any;
declare function getValueType(v: any): any;
declare function getEffectiveCellType(cell: any): any;
declare class CellXform extends BaseXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    renderFormula(xmlStream: any, model: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
