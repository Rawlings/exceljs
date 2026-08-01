import BaseXform from '../../base-xform';
declare class ConditionalFormattingsXform extends BaseXform {
    constructor();
    get tag(): string;
    reset(): void;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
export default ConditionalFormattingsXform;
