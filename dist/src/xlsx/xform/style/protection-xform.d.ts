declare const BaseXform: any;
declare const validation: {
    boolean(value: any, dflt: any): any;
};
declare class ProtectionXform extends BaseXform {
    get tag(): string;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): void;
    parseText(): void;
    parseClose(): boolean;
}
