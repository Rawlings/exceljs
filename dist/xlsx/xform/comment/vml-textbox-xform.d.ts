import BaseXform from '../base-xform';
declare class VmlTextboxXform extends BaseXform {
    get tag(): string;
    conversionUnit(value: any, multiple: any, unit: any): string;
    reverseConversionUnit(inset: any): any;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
export default VmlTextboxXform;
