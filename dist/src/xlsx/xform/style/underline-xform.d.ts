declare const BaseXform: any;
declare class UnderlineXform extends BaseXform {
    constructor(model: any);
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(): void;
    parseClose(): boolean;
}
