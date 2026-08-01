import BaseXform from '../base-xform';
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
export default PivotTableXform;
