import BaseXform from '../base-xform';
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
export default CellXform;
