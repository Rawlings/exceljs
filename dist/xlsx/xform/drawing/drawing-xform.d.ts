import BaseXform from '../base-xform';
declare class DrawingXform extends BaseXform {
    constructor();
    prepare(model: any): void;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
export default DrawingXform;
