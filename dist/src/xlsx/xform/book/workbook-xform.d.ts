declare const _: any;
declare const colCache: any;
declare const XmlStream: any;
declare const BaseXform: any;
declare const StaticXform: any;
declare const ListXform: any;
declare const DefinedNameXform: any;
declare const SheetXform: any;
declare const WorkbookViewXform: any;
declare const WorkbookPropertiesXform: any;
declare const WorkbookCalcPropertiesXform: any;
declare const WorkbookPivotCacheXform: any;
declare class WorkbookXform extends BaseXform {
    constructor();
    prepare(model: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any): void;
}
