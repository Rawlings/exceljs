import BaseXform from './base-xform';
declare class StaticXform extends BaseXform {
    constructor(model: any);
    render(xmlStream: any): void;
    parseOpen(): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
}
export default StaticXform;
