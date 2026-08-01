import BaseXform from '../base-xform';
declare class AppHeadingPairsXform extends BaseXform {
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
export default AppHeadingPairsXform;
