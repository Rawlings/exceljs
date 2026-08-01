import CompositeXform from '../../composite-xform';
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
    createNewModel({ attributes }: any): {
        type: any;
        operator: any;
        dxfId: number;
        priority: number;
        timePeriod: any;
        percent: boolean;
        bottom: boolean;
        rank: number;
        aboveAverage: boolean;
    };
    onParserClose(name: any, parser: any): void;
}
export default CfRuleXform;
