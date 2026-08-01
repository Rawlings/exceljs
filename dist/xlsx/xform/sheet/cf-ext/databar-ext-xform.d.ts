import CompositeXform from '../../composite-xform';
declare class DatabarExtXform extends CompositeXform {
    constructor();
    static isExt(rule: any): boolean;
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: any): {
        cfvo: never[];
        minLength: number;
        maxLength: number;
        border: boolean;
        gradient: boolean;
        negativeBarColorSameAsPositive: boolean;
        negativeBarBorderColorSameAsPositive: boolean;
        axisPosition: any;
        direction: any;
    };
    onParserClose(name: any, parser: any): void;
}
export default DatabarExtXform;
