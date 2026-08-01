import BaseCellAnchorXform from './base-cell-anchor-xform';
declare class TwoCellAnchorXform extends BaseCellAnchorXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
export default TwoCellAnchorXform;
