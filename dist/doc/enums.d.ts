export declare enum ValueType {
    Null = 0,
    Merge = 1,
    Number = 2,
    String = 3,
    Date = 4,
    Hyperlink = 5,
    Formula = 6,
    SharedString = 7,
    RichText = 8,
    Boolean = 9,
    Error = 10
}
export declare enum FormulaType {
    None = 0,
    Master = 1,
    Shared = 2
}
export declare enum RelationshipType {
    None = 0,
    OfficeDocument = 1,
    Worksheet = 2,
    CalcChain = 3,
    SharedStrings = 4,
    Styles = 5,
    Theme = 6,
    Hyperlink = 7
}
export declare enum DocumentType {
    Xlsx = 1
}
export declare enum ReadingOrder {
    LeftToRight = 1,
    RightToLeft = 2
}
export declare const ErrorValue: {
    readonly NotApplicable: '#N/A';
    readonly Ref: '#REF!';
    readonly Name: '#NAME?';
    readonly DivZero: '#DIV/0!';
    readonly Null: '#NULL!';
    readonly Value: '#VALUE!';
    readonly Num: '#NUM!';
};
declare const _default: {
    ValueType: typeof ValueType;
    FormulaType: typeof FormulaType;
    RelationshipType: typeof RelationshipType;
    DocumentType: typeof DocumentType;
    ReadingOrder: typeof ReadingOrder;
    ErrorValue: {
        readonly NotApplicable: '#N/A';
        readonly Ref: '#REF!';
        readonly Name: '#NAME?';
        readonly DivZero: '#DIV/0!';
        readonly Null: '#NULL!';
        readonly Value: '#VALUE!';
        readonly Num: '#NUM!';
    };
};
export default _default;
