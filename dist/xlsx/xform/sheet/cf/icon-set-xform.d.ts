import CompositeXform from '../../composite-xform';
declare class IconSetXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: any): {
        iconSet: any;
        reverse: boolean;
        showValue: boolean;
        cfvo: never[];
    };
    onParserClose(name: any, parser: any): void;
}
export default IconSetXform;
