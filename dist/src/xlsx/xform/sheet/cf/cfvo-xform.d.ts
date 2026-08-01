declare const BaseXform: any;
declare class CfvoXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseClose(name: any): boolean;
}
