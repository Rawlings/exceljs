declare const BaseXform: any;
declare const HlickClickXform: any;
declare const ExtLstXform: any;
declare class CNvPrXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
