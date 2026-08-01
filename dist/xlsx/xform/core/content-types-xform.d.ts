import BaseXform from '../base-xform';
declare class ContentTypesXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default ContentTypesXform;
