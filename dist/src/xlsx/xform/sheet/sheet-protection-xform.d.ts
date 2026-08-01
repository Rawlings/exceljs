declare const _: any;
declare const BaseXform: any;
declare function xmlToBoolean(value: any, equals: any): boolean;
declare class SheetProtectionXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
