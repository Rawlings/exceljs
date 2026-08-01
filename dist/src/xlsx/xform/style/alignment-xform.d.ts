declare const Enums: any;
declare const utils: any;
declare const BaseXform: any;
declare const validation: {
    horizontalValues: {};
    horizontal(value: any): any;
    verticalValues: {};
    vertical(value: any): any;
    wrapText(value: any): boolean;
    shrinkToFit(value: any): boolean;
    textRotation(value: any): any;
    indent(value: any): number;
    readingOrder(value: any): any;
};
declare const textRotationXform: {
    toXml(textRotation: any): number;
    toModel(textRotation: any): any;
};
declare class AlignmentXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(): void;
    parseClose(): boolean;
}
