declare const objectFromProps: any, range: any, toSortedArray: any;
declare function makePivotTable(worksheet: any, model: any): {
    sourceSheet: any;
    rows: any;
    columns: any;
    values: any;
    metric: string;
    cacheFields: any[];
    cacheId: string;
};
declare function validate(worksheet: any, model: any): void;
declare function makeCacheFields(worksheet: any, fieldNamesWithSharedItems: any): any[];
