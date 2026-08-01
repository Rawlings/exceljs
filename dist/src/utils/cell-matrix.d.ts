declare const _: any;
declare const colCache: any;
declare class CellMatrix {
    constructor(template: any);
    addCell(addressStr: any): void;
    getCell(addressStr: any): any;
    findCell(addressStr: any): any;
    findCellAt(sheetName: any, rowNumber: any, colNumber: any): any;
    addCellEx(address: any): void;
    getCellEx(address: any): any;
    findCellEx(address: any, create: any): any;
    getCellAt(sheetName: any, rowNumber: any, colNumber: any): any;
    removeCellEx(address: any): void;
    forEachInSheet(sheetName: any, callback: any): void;
    forEach(callback: any): void;
    map(callback: any): any[];
    findSheet(address: any, create: any): any;
    findSheetRow(sheet: any, address: any, create: any): any;
    findRowCell(row: any, address: any, create: any): any;
    spliceRows(sheetName: any, start: any, numDelete: any, numInsert: any): void;
    spliceColumns(sheetName: any, start: any, numDelete: any, numInsert: any): void;
}
