declare const colCache: any;
declare const BaseXform: any;
declare const VIEW_STATES: {
    frozen: string;
    frozenSplit: string;
    split: string;
};
declare class SheetViewXform extends BaseXform {
    get tag(): string;
    prepare(model: any): void;
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(name: any): boolean;
    reconcile(): void;
}
