import CompositeXform from '../../composite-xform';
declare class ConditionalFormattingXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel({ attributes }: any): {
        ref: any;
        rules: never[];
    };
    onParserClose(name: any, parser: any): void;
}
export default ConditionalFormattingXform;
