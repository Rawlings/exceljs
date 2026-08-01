import BaseXform from '../../base-xform';
declare class FormulaXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(): void;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
export default FormulaXform;
