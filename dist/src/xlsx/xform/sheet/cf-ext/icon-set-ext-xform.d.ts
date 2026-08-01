declare const BaseXform: any;
declare const CompositeXform: any;
declare const CfvoExtXform: any;
declare const CfIconExtXform: any;
declare class IconSetExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: {
        attributes: any;
    }): {
        cfvo: undefined[];
        iconSet: any;
        reverse: any;
        showValue: any;
    };
    onParserClose(name: any, parser: any): void;
}
