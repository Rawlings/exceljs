declare const CompositeXform: any;
declare const ColorXform: any;
declare const CfvoXform: any;
declare class DatabarXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(): {
        cfvo: undefined[];
    };
    onParserClose(name: any, parser: any): void;
}
