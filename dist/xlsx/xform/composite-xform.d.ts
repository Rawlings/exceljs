import BaseXform from './base-xform';
declare class CompositeXform extends BaseXform {
    createNewModel(node: any): {};
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    onParserClose(name: any, parser: any): void;
    parseClose(name: any): boolean;
}
export default CompositeXform;
