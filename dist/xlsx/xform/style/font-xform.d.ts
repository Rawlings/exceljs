import BaseXform from '../base-xform';
declare class FontXform extends BaseXform {
    constructor(options: any);
    get tag(): any;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): any;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default FontXform;
