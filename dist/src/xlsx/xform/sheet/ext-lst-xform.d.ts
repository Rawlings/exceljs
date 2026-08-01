declare const CompositeXform: any;
declare const ConditionalFormattingsExt: any;
declare class ExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    hasContent(model: any): any;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    createNewModel(): {};
    onParserClose(name: any, parser: any): void;
}
declare class ExtLstXform extends CompositeXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    hasContent(model: any): any;
    render(xmlStream: any, model: any): void;
    createNewModel(): {};
    onParserClose(name: any, parser: any): void;
}
