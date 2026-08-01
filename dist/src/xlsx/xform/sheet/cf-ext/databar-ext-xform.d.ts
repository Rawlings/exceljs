declare const BaseXform: any;
declare const CompositeXform: any;
declare const ColorXform: any;
declare const CfvoExtXform: any;
declare class DatabarExtXform extends CompositeXform {
    constructor();
    static isExt(rule: any): boolean;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: {
        attributes: any;
    }): {
        cfvo: undefined[];
        minLength: any;
        maxLength: any;
        border: any;
        gradient: any;
        negativeBarColorSameAsPositive: any;
        negativeBarBorderColorSameAsPositive: any;
        axisPosition: any;
        direction: any;
    };
    onParserClose(name: any, parser: any): void;
}
