declare const toString: () => string;
declare const escapeHtmlRegex: RegExp;
declare const _: {
    each: (obj: any, cb: any) => void;
    some: (obj: any, cb: any) => boolean;
    every: (obj: any, cb: any) => boolean;
    map: (obj: any, cb: any) => any[];
    keyBy(a: any, p: any): any;
    isEqual: (a: any, b: any) => any;
    escapeHtml(html: any): any;
    strcmp(a: any, b: any): -1 | 0 | 1;
    isUndefined(val: any): boolean;
    isObject(val: any): boolean;
    deepMerge(): any;
};
