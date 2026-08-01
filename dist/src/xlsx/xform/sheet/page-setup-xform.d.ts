declare const _: any;
declare const BaseXform: any;
declare function pageOrderToXml(model: any): any;
declare function cellCommentsToXml(model: any): any;
declare function errorsToXml(model: any): any;
declare function pageSizeToModel(value: any): number;
declare class PageSetupXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
