declare const BaseXform: any;
declare const CompositeXform: any;
declare const CfvoXform: any;
declare class IconSetXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: {
        attributes: any;
    }): {
        iconSet: any;
        reverse: any;
        showValue: any;
        cfvo: undefined[];
    };
    onParserClose(name: any, parser: any): void;
}
