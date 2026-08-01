declare class XLSX {
    workbook: any;
    static RelType: any;
    constructor(workbook?: any);
    readFile(filename: any, options: any): Promise<any>;
    parseRels(stream: any): Promise<any>;
    parseWorkbook(stream: any): Promise<any>;
    parseSharedStrings(stream: any): Promise<any>;
    reconcile(model: any, options: any): void;
    _processWorksheetEntry(stream: any, model: any, sheetNo: any, options: any, path: any): Promise<void>;
    _processCommentEntry(stream: any, model: any, name: any): Promise<void>;
    _processTableEntry(stream: any, model: any, name: any): Promise<void>;
    _processWorksheetRelsEntry(stream: any, model: any, sheetNo: any): Promise<void>;
    _processMediaEntry(entry: any, model: any, filename: any): Promise<void>;
    _processDrawingEntry(entry: any, model: any, name: any): Promise<void>;
    _processDrawingRelsEntry(entry: any, model: any, name: any): Promise<void>;
    _processVmlDrawingEntry(entry: any, model: any, name: any): Promise<void>;
    _processThemeEntry(entry: any, model: any, name: any): Promise<void>;
    /**
     * @deprecated since version 4.0. You should use `#read` instead. Please follow upgrade instruction: https://github.com/exceljs/exceljs/blob/master/UPGRADE-4.0.md
     */
    createInputStream(): void;
    read(stream: any, options: any): Promise<any>;
    load(data: any, options: any): Promise<any>;
    addMedia(zip: any, model: any): Promise<void>;
    addDrawings(zip: any, model: any): void;
    addTables(zip: any, model: any): void;
    addPivotTables(zip: any, model: any): void;
    addContentTypes(zip: any, model: any): Promise<void>;
    addApp(zip: any, model: any): Promise<void>;
    addCore(zip: any, model: any): Promise<void>;
    addThemes(zip: any, model: any): Promise<void>;
    addOfficeRels(zip: any): Promise<void>;
    addWorkbookRels(zip: any, model: any): Promise<void>;
    addSharedStrings(zip: any, model: any): Promise<void>;
    addStyles(zip: any, model: any): Promise<void>;
    addWorkbook(zip: any, model: any): Promise<void>;
    addWorksheets(zip: any, model: any): Promise<void>;
    _finalize(zip: any): Promise<unknown>;
    prepareModel(model: any, options: any): void;
    write(stream: any, options: any): Promise<unknown>;
    writeFile(filename: any, options: any): Promise<unknown>;
    writeBuffer(options: any): Promise<any>;
}
export default XLSX;
