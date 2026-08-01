declare const BaseXform: any;
declare const CompositeXform: any;
declare const Range: any;
declare const DatabarXform: any;
declare const ExtLstRefXform: any;
declare const FormulaXform: any;
declare const ColorScaleXform: any;
declare const IconSetXform: any;
declare const extIcons: {
    '3Triangles': boolean;
    '3Stars': boolean;
    '5Boxes': boolean;
};
declare const getTextFormula: (model: any) => any;
declare const getTimePeriodFormula: (model: any) => any;
declare const opType: (attributes: any) => {
    type: any;
    operator: any;
};
declare class CfRuleXform extends CompositeXform {
    constructor();
    get tag(): string;
    static isPrimitive(rule: any): boolean;
    render(xmlStream: any, model: any): void;
    renderExpression(xmlStream: any, model: any): void;
    renderCellIs(xmlStream: any, model: any): void;
    renderTop10(xmlStream: any, model: any): void;
    renderAboveAverage(xmlStream: any, model: any): void;
    renderDataBar(xmlStream: any, model: any): void;
    renderColorScale(xmlStream: any, model: any): void;
    renderIconSet(xmlStream: any, model: any): void;
    renderText(xmlStream: any, model: any): void;
    renderTimePeriod(xmlStream: any, model: any): void;
    createNewModel({ attributes }: {
        attributes: any;
    }): {
        type: any;
        operator: any;
        dxfId: any;
        priority: any;
        timePeriod: any;
        percent: any;
        bottom: any;
        rank: any;
        aboveAverage: any;
    };
    onParserClose(name: any, parser: any): void;
}
