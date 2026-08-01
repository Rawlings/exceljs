import BaseXform from '../base-xform';
declare class AutoFilterXform extends BaseXform {
    constructor();
    get tag(): string;
    prepare(model: any): void;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default AutoFilterXform;
