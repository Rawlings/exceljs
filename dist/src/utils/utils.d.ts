declare const fs: any;
declare const inherits: (cls: any, superCtor: any, statics: any, prototype: any) => void;
declare const xmlDecodeRegex: RegExp;
declare const utils: {
    nop(): void;
    promiseImmediate(value: any): Promise<unknown>;
    inherits: typeof inherits;
    dateToExcel(d: any, date1904: any): number;
    excelToDate(v: any, date1904: any): Date;
    parsePath(filepath: any): {
        path: any;
        name: any;
    };
    getRelsPath(filepath: any): string;
    xmlEncode(text: any): any;
    xmlDecode(text: any): any;
    validInt(value: any): number;
    isDateFmt(fmt: any): boolean;
    fs: {
        exists(path: any): Promise<unknown>;
    };
    toIsoDateString(dt: any): any;
    parseBoolean(value: any): boolean;
    range(start: any, stop: any, step?: number): Generator<any, void, unknown>;
    toSortedArray(values: any): unknown[];
    objectFromProps(props: any, value?: any): any;
};
