declare const _: any;
declare const defaultNumFormats: any;
declare const BaseXform: any;
declare function hashDefaultFormats(): {};
declare const defaultFmtHash: {};
declare class NumFmtXform extends BaseXform {
    constructor(id: any, formatCode: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
