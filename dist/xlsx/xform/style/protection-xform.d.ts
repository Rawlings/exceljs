import BaseXform from '../base-xform';
declare class ProtectionXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(): void;
    parseClose(): boolean;
}
export default ProtectionXform;
