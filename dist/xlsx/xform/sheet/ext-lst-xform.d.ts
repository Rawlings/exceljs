import CompositeXform from '../composite-xform';
declare class ExtLstXform extends CompositeXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    hasContent(model: any): any;
    render(xmlStream: any, model: any): void;
    createNewModel(): {};
    onParserClose(name: any, parser: any): void;
}
export default ExtLstXform;
