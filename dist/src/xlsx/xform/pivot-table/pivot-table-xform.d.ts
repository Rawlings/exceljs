declare const XmlStream: any;
declare const BaseXform: any;
declare class PivotTableXform extends BaseXform {
    constructor();
    prepare(model: any): void;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(text: any): void;
    parseClose(name: any): void;
    reconcile(model: any, options: any): void;
}
declare function renderPivotFields(pivotTable: any): any;
declare function renderPivotField(fieldType: any, sharedItems: any): string;
