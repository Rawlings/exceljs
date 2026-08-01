import BaseXform from '../base-xform';
declare class CellPositionXform extends BaseXform {
    constructor(options: any);
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default CellPositionXform;
