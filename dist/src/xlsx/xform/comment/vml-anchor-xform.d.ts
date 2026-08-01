declare const BaseXform: any;
declare class VmlAnchorXform extends BaseXform {
    get tag(): string;
    getAnchorRect(anchor: any): number[];
    getDefaultRect(ref: any): any[];
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(): boolean;
}
