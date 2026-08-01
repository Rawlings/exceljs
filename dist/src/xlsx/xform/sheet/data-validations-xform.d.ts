declare const _: any;
declare const utils: any;
declare const colCache: any;
declare const BaseXform: any;
declare const Range: any;
declare function assign(definedName: any, attributes: any, name: any, defaultValue: any): void;
declare function assignBool(definedName: any, attributes: any, name: any, defaultValue: any): void;
declare function optimiseDataValidations(model: any): any;
declare class DataValidationsXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(text: any): void;
    parseClose(name: any): boolean;
}
