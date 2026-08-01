import BaseXform from '../base-xform';
declare class StyleXform extends BaseXform {
    constructor(options: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default StyleXform;
