import BaseXform from '../base-xform';
declare class ColXform extends BaseXform {
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
    reconcile(model: any, options: any): void;
}
export default ColXform;
