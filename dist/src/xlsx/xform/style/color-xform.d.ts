declare const BaseXform: any;
declare class ColorXform extends BaseXform {
    constructor(name: any);
    get tag(): any;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
