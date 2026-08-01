import BaseXform from '../base-xform';
declare class CoreXform extends BaseXform {
    constructor();
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default CoreXform;
