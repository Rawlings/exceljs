declare const CompositeXform: any;
declare const FExtXform: any;
declare class CfvoExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(node: any): {
        type: any;
    };
    onParserClose(name: any, parser: any): void;
}
