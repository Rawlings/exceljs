import CompositeXform from '../../composite-xform';
declare class ColorScaleXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(node: any): {
        cfvo: never[];
        color: never[];
    };
    onParserClose(name: any, parser: any): void;
}
export default ColorScaleXform;
