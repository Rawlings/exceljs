declare const CompositeXform: any;
declare const CfRuleExtXform: any;
declare const ConditionalFormattingExtXform: any;
declare class ConditionalFormattingsExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    hasContent(model: any): any;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    createNewModel(): any[];
    onParserClose(name: any, parser: any): void;
}
