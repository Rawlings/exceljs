declare const BaseXform: any;
declare class HyperlinkXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
    isInternalLink(model: any): boolean;
}
