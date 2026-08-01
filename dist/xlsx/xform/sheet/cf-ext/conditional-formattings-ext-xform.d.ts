import CompositeXform from '../../composite-xform';
declare class ConditionalFormattingsExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    hasContent(model: any): any;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    createNewModel(): never[];
    onParserClose(name: any, parser: any): void;
}
export default ConditionalFormattingsExtXform;
