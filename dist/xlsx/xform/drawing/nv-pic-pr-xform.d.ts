import BaseXform from '../base-xform';
declare class NvPicPrXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
export default NvPicPrXform;
