declare const colCache: any;
declare const BaseXform: any;
declare class AutoFilterXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
}
