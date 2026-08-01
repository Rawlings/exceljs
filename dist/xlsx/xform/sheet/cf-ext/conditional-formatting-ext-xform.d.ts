import CompositeXform from '../../composite-xform';
declare class ConditionalFormattingExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    prepare(model: any, options: any): void;
    render(xmlStream: any, model: any): void;
    createNewModel(): {
        rules: never[];
    };
    onParserClose(name: any, parser: any): void;
}
export default ConditionalFormattingExtXform;
