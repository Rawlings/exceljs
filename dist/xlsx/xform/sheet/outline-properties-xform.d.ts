import BaseXform from '../base-xform';
declare class OutlinePropertiesXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default OutlinePropertiesXform;
