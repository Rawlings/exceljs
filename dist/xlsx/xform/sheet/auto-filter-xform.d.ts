import BaseXform from '../base-xform';
declare class AutoFilterXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
}
export default AutoFilterXform;
