import BaseXform from '../base-xform';
declare class UnderlineXform extends BaseXform {
    static Attributes: any;
    constructor(model?: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(): void;
    parseClose(): boolean;
}
export default UnderlineXform;
