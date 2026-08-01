import BaseXform from '../../base-xform';
declare class CfIconExtXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen({ attributes }: any): void;
    parseClose(name: any): boolean;
}
export default CfIconExtXform;
