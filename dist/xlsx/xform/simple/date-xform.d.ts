import BaseXform from '../base-xform';
declare class DateXform extends BaseXform {
    constructor(options: any);
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(text: any): void;
    parseClose(): boolean;
}
export default DateXform;
