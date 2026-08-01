declare const BaseXform: any;
declare class BaseCellAnchorXform extends BaseXform {
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    reconcilePicture(model: any, options: any): any;
}
