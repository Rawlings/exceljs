import BaseXform from '../../base-xform';
declare class VmlPositionXform extends BaseXform {
    constructor(model: any);
    get tag(): any;
    render(xmlStream: any, model: any, type: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
export default VmlPositionXform;
