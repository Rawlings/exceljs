import BaseXform from '../base-xform';
declare class SheetProtectionXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default SheetProtectionXform;
