import BaseXform from '../base-xform';
declare class RowXform extends BaseXform {
    constructor(options: any);
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any, options: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
export default RowXform;
