import BaseXform from '../base-xform';
declare class WorkbookXform extends BaseXform {
    constructor();
    prepare(model: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any): void;
}
export default WorkbookXform;
