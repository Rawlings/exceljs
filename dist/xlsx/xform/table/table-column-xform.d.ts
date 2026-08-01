import BaseXform from '../base-xform';
declare class TableColumnXform extends BaseXform {
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default TableColumnXform;
