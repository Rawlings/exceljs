import BaseXform from '../base-xform';
declare class RichTextXform extends BaseXform {
    constructor(model: any);
    get tag(): string;
    get textXform(): any;
    get fontXform(): any;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default RichTextXform;
