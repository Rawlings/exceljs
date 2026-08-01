export declare class CSV {
    workbook: any;
    worksheet: any;
    constructor(workbook: any);
    readFile(filename: string, options?: any): Promise<any>;
    read(stream: any, options?: any): Promise<any>;
    createInputStream(): never;
    write(stream: any, options?: any): Promise<void>;
    writeFile(filename: string, options?: any): Promise<void>;
    writeBuffer(options?: any): Promise<any>;
}
export default CSV;
