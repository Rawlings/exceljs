declare const BaseXform: any;
declare const isDefined: (attr: any) => boolean;
declare class OutlinePropertiesXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): boolean;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
