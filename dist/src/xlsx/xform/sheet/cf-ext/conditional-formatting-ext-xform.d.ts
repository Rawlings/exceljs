declare const CompositeXform: any;
declare const SqRefExtXform: any;
declare const CfRuleExtXform: any;
declare class ConditionalFormattingExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    createNewModel(): {
        rules: undefined[];
    };
    onParserClose(name: any, parser: any): void;
}
