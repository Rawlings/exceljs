declare const colCache: any;
declare const _: any;
declare const Enums: any;
declare const slideFormula: any;
declare const Note: any;
declare class Cell {
    constructor(row: any, column: any, address: any);
    get worksheet(): any;
    get workbook(): any;
    destroy(): void;
    get numFmt(): any;
    set numFmt(value: any);
    get font(): any;
    set font(value: any);
    get alignment(): any;
    set alignment(value: any);
    get border(): any;
    set border(value: any);
    get fill(): any;
    set fill(value: any);
    get protection(): any;
    set protection(value: any);
    _mergeStyle(rowStyle: any, colStyle: any, style: any): any;
    get address(): any;
    get row(): any;
    get col(): any;
    get $col$row(): string;
    get type(): any;
    get effectiveType(): any;
    toCsvString(): any;
    addMergeRef(): void;
    releaseMergeRef(): void;
    get isMerged(): boolean;
    merge(master: any, ignoreStyle: any): void;
    unmerge(): void;
    isMergedTo(master: any): any;
    get master(): any;
    get isHyperlink(): boolean;
    get hyperlink(): any;
    get value(): any;
    set value(v: any);
    get note(): any;
    set note(note: any);
    get text(): any;
    get html(): any;
    toString(): any;
    _upgradeToHyperlink(hyperlink: any): void;
    get formula(): any;
    get result(): any;
    get formulaType(): any;
    get fullAddress(): {
        sheetName: any;
        address: any;
        row: any;
        col: any;
    };
    get name(): any;
    set name(value: any);
    get names(): any;
    set names(value: any);
    addName(name: any): void;
    removeName(name: any): void;
    removeAllNames(): void;
    get _dataValidations(): any;
    get dataValidation(): any;
    set dataValidation(value: any);
    get model(): any;
    set model(value: any);
}
declare class NullValue {
    constructor(cell: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): string;
    release(): void;
    toString(): string;
}
declare class NumberValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): any;
    release(): void;
    toString(): any;
}
declare class StringValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): string;
    release(): void;
    toString(): any;
}
declare class RichTextValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    toString(): any;
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): string;
    release(): void;
}
declare class DateValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): any;
    release(): void;
    toString(): any;
}
declare class HyperlinkValue {
    constructor(cell: any, value: any);
    get value(): {
        text: any;
        hyperlink: any;
    };
    set value(value: {
        text: any;
        hyperlink: any;
    });
    get text(): any;
    set text(value: any);
    get hyperlink(): any;
    set hyperlink(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): any;
    release(): void;
    toString(): any;
}
declare class MergeValue {
    constructor(cell: any, master: any);
    get value(): any;
    set value(value: any);
    isMergedTo(master: any): boolean;
    get master(): any;
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): string;
    release(): void;
    toString(): any;
}
declare class FormulaValue {
    constructor(cell: any, value: any);
    _copyModel(model: any): {};
    get value(): {};
    set value(value: {});
    validate(value: any): void;
    get dependencies(): {
        ranges: any;
        cells: any;
    };
    get formula(): any;
    set formula(value: any);
    get formulaType(): any;
    get result(): any;
    set result(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    _getTranslatedFormula(): any;
    toCsvString(): string;
    release(): void;
    toString(): any;
}
declare class SharedStringValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): any;
    release(): void;
    toString(): any;
}
declare class BooleanValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): 0 | 1;
    release(): void;
    toString(): any;
}
declare class ErrorValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): any;
    release(): void;
    toString(): any;
}
declare class JSONValue {
    constructor(cell: any, value: any);
    get value(): any;
    set value(value: any);
    get type(): any;
    get effectiveType(): any;
    get address(): any;
    set address(value: any);
    toCsvString(): any;
    release(): void;
    toString(): any;
}
declare const Value: {
    getType(value: any): any;
    types: any[];
    create(type: any, cell: any, value: any): any;
};
