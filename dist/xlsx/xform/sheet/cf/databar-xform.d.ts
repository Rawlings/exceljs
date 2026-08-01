import CompositeXform from '../../composite-xform';
declare class DatabarXform extends CompositeXform {
    constructor();
    get tag(): string;
    render(xmlStream: any, model: any): void;
    createNewModel(): {
        cfvo: never[];
    };
    onParserClose(name: any, parser: any): void;
}
export default DatabarXform;
