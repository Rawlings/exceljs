import BaseXform from '../base-xform';
declare class BooleanXform extends BaseXform {
    constructor(options: any);
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(): void;
    parseClose(): boolean;
}
export default BooleanXform;
