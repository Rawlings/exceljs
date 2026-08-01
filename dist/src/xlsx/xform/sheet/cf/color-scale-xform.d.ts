declare const CompositeXform: any;
declare const ColorXform: any;
declare const CfvoXform: any;
declare class ColorScaleXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(node: any): {
        cfvo: undefined[];
        color: undefined[];
    };
    onParserClose(name: any, parser: any): void;
}
