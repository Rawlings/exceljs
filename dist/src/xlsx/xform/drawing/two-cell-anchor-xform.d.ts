declare const BaseCellAnchorXform: any;
declare const StaticXform: any;
declare const CellPositionXform: any;
declare const PicXform: any;
declare class TwoCellAnchorXform extends BaseCellAnchorXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    parseClose(name: any): boolean;
    reconcile(model: any, options: any): void;
}
