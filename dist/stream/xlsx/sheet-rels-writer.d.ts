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
export default SheetRelsWriter;
