import BaseXform from '../base-xform';
declare class RelationshipXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default RelationshipXform;
