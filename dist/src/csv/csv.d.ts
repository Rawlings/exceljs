declare const fs: any;
declare const access: any;
declare const StreamBuf: any;
declare function fileExists(filename: any): Promise<boolean>;
declare const SpecialValues: {
    true: boolean;
    false: boolean;
    '#N/A': {
        error: string;
    };
    '#REF!': {
        error: string;
    };
    '#NAME?': {
        error: string;
    };
    '#DIV/0!': {
        error: string;
    };
    '#NULL!': {
        error: string;
    };
    '#VALUE!': {
        error: string;
    };
    '#NUM!': {
        error: string;
    };
};
declare function parseCsvLine(line: any, delimiter?: string): any[];
declare function parseDateNative(str: any): Date;
declare function defaultReadMap(datum: any): any;
declare function defaultWriteMap(value: any): any;
declare class CSV {
    constructor(workbook: any);
    readFile(filename: any, options?: {}): Promise<unknown>;
    read(stream: any, options?: {}): Promise<unknown>;
    createInputStream(): void;
    write(stream: any, options?: {}): Promise<unknown>;
    writeFile(filename: any, options?: {}): Promise<unknown>;
    writeBuffer(options: any): Promise<any>;
}
