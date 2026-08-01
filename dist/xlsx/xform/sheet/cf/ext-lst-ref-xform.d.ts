import CompositeXform from '../../composite-xform';
declare class ExtLstRefXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(): {};
    onParserClose(name: any, parser: any): void;
}
export default ExtLstRefXform;
