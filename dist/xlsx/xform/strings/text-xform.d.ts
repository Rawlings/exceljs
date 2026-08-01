import BaseXform from '../base-xform';
declare class TextXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    get model(): any;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(): boolean;
}
export default TextXform;
