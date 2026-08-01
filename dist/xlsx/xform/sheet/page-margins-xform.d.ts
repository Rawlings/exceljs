import BaseXform from '../base-xform';
declare class PageMarginsXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default PageMarginsXform;
