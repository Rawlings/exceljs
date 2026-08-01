declare const CompositeXform: any;
declare const CfRuleXform: any;
declare class ConditionalFormattingXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: {
        attributes: any;
    }): {
        ref: any;
        rules: undefined[];
    };
    onParserClose(name: any, parser: any): void;
}
