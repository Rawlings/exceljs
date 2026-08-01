import BaseXform from '../base-xform';
declare class WorkbookPivotCacheXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default WorkbookPivotCacheXform;
