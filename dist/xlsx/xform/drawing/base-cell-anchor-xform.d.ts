import BaseXform from '../base-xform';
declare class BaseCellAnchorXform extends BaseXform {
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    reconcilePicture(model: any, options: any): any;
}
export default BaseCellAnchorXform;
