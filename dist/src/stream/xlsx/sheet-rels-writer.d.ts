declare const utils: any;
declare const RelType: any;
declare class HyperlinksProxy {
    constructor(sheetRelsWriter: any);
    push(hyperlink: any): void;
}
declare class SheetRelsWriter {
    constructor(options: any);
    get stream(): any;
    get length(): any;
    each(fn: any): any;
    get hyperlinksProxy(): any;
    addHyperlink(hyperlink: any): void;
    addMedia(media: any): string;
    addRelationship(rel: any): string;
    commit(): void;
    _writeOpen(): void;
    _writeRelationship(relationship: any): string;
    _writeClose(): void;
}
