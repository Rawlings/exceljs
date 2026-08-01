export { makePivotTable };
declare const _default: {
    makePivotTable: typeof makePivotTable;
};
export default _default;
declare function makePivotTable(worksheet: any, model: any): {
    sourceSheet: any;
    rows: any;
    columns: any;
    values: any;
    metric: string;
    cacheFields: {
        name: any;
        sharedItems: unknown[] | null;
    }[];
    cacheId: string;
};
