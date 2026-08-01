import BaseXform from '../base-xform';
declare class SharedStringsXform extends BaseXform {
    constructor(model: any);
    get sharedStringXform(): any;
    get values(): any;
    get uniqueCount(): any;
    get count(): any;
    getString(index: any): any;
    add(value: any): any;
    addText(value: any): any;
    addRichText(value: any): any;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default SharedStringsXform;
