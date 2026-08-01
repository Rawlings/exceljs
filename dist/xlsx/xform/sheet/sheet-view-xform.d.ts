import BaseXform from '../base-xform';
declare class SheetViewXform extends BaseXform {
    get tag(): string;
    prepare(model: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
    reconcile(): void;
}
export default SheetViewXform;
