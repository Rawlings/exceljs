import CompositeXform from '../../composite-xform';
declare class IconSetExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: any): {
        cfvo: never[];
        iconSet: any;
        reverse: boolean;
        showValue: boolean;
    };
    onParserClose(name: any, parser: any): void;
}
export default IconSetExtXform;
