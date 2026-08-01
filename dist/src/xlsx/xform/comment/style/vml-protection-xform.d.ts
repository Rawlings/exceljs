declare const BaseXform: any;
declare class VmlProtectionXform extends BaseXform {
    constructor(model: any);
    get tag(): any;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(): boolean;
}
