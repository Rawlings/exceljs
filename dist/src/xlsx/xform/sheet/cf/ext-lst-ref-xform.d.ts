declare const BaseXform: any;
declare const CompositeXform: any;
declare class X14IdXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(): void;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
declare class ExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(): {};
    onParserClose(name: any, parser: any): void;
}
declare class ExtLstRefXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(): {};
    onParserClose(name: any, parser: any): void;
}
