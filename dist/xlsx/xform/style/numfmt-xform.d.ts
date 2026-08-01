import BaseXform from '../base-xform';
declare class NumFmtXform extends BaseXform {
    static getDefaultFmtId: any;
    static getDefaultFmtCode: any;
    id: any;
    formatCode: any;
    constructor(id?: any, formatCode?: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default NumFmtXform;
