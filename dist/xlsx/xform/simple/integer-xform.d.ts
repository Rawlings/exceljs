import BaseXform from '../base-xform';
declare class IntegerXform extends BaseXform {
    constructor(options: any);
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(): boolean;
}
export default IntegerXform;
