import BaseXform from '../base-xform';
declare class FillXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    validStyle(value: any): any;
}
export default FillXform;
