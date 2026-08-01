import BaseXform from '../base-xform';
declare class DefinedNamesXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(): boolean;
}
export default DefinedNamesXform;
