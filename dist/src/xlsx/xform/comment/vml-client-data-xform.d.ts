declare const BaseXform: any;
declare const VmlAnchorXform: any;
declare const VmlProtectionXform: any;
declare const VmlPositionXform: any;
declare const POSITION_TYPE: string[];
declare class VmlClientDataXform extends BaseXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
    normalizeModel(): void;
}
