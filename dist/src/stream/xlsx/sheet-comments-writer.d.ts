declare const XmlStream: any;
declare const RelType: any;
declare const colCache: any;
declare const CommentXform: any;
declare const VmlShapeXform: any;
declare class SheetCommentsWriter {
    constructor(worksheet: any, sheetRelsWriter: any, options: any);
    get commentsStream(): any;
    get vmlStream(): any;
    _addRelationships(): void;
    _addCommentRefs(): void;
    _writeOpen(): void;
    _writeComment(comment: any, index: any): void;
    _writeClose(): void;
    addComments(comments: any): void;
    commit(): void;
}
