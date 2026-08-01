import CompositeXform from '../../composite-xform';
declare class CfRuleExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    static isExt(rule: any): boolean;
    prepare(model: any): void;
    render(xmlStream: any, model: any): void;
    renderDataBar(xmlStream: any, model: any): void;
    renderIconSet(xmlStream: any, model: any): void;
    createNewModel({ attributes }: any): {
        type: any;
        x14Id: any;
        priority: number;
    };
    onParserClose(name: any, parser: any): void;
}
export default CfRuleExtXform;
