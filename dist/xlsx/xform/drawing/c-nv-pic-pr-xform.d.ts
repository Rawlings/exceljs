import BaseXform from '../base-xform';
declare class CNvPicPrXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
export default CNvPicPrXform;
