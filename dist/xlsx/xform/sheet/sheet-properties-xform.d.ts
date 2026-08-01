import BaseXform from '../base-xform';
declare class SheetPropertiesXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): boolean;
    parseClose(name: any): boolean;
}
export default SheetPropertiesXform;
