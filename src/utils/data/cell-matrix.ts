import _ from '#src/utils/helpers/under-dash';
import colCache from '#src/utils/data/col-cache';

class CellMatrix {
  template: any;
  sheets: Record<string, any[]>;

  constructor(template?: any) {
    this.template = template;
    this.sheets = {};
  }

  addCell(addressStr: string): void {
    this.addCellEx(colCache.decodeEx(addressStr));
  }

  getCell(addressStr: string): any {
    return this.findCellEx(colCache.decodeEx(addressStr), true);
  }

  findCell(addressStr: string): any {
    return this.findCellEx(colCache.decodeEx(addressStr), false);
  }

  findCellAt(sheetName: string, rowNumber: number, colNumber: number): any {
    const sheet = this.sheets[sheetName];
    const row = sheet && sheet[rowNumber];
    return row && row[colNumber];
  }

  addCellEx(address: any): void {
    if (address.top) {
      for (let row = address.top; row <= address.bottom; row++) {
        for (let col = address.left; col <= address.right; col++) {
          this.getCellAt(address.sheetName, row, col);
        }
      }
    } else {
      this.findCellEx(address, true);
    }
  }

  getCellEx(address: any): any {
    return this.findCellEx(address, true);
  }

  findCellEx(address: any, create: boolean): any {
    const sheet = this.findSheet(address, create);
    const row = this.findSheetRow(sheet, address, create);
    return this.findRowCell(row, address, create);
  }

  getCellAt(sheetName: string, rowNumber: number, colNumber: number): any {
    const sheet = this.sheets[sheetName] || (this.sheets[sheetName] = []);
    const row = sheet[rowNumber] || (sheet[rowNumber] = []);
    const cell =
      row[colNumber] ||
      (row[colNumber] = {
        sheetName,
        address: colCache.n2l(colNumber) + rowNumber,
        row: rowNumber,
        col: colNumber,
      });
    return cell;
  }

  removeCellEx(address: any): void {
    const sheet = this.findSheet(address, false);
    if (!sheet) return;
    const row = this.findSheetRow(sheet, address, false);
    if (!row) return;
    delete row[address.col];
  }

  forEachInSheet(
    sheetName: string,
    callback: (cell: any, rowNumber: number, colNumber: number) => void
  ): void {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      sheet.forEach((row: any, rowNumber: number) => {
        if (row) {
          row.forEach((cell: any, colNumber: number) => {
            if (cell) {
              callback(cell, rowNumber, colNumber);
            }
          });
        }
      });
    }
  }

  forEach(callback: (cell: any, rowNumber: number, colNumber: number) => void): void {
    _.each(this.sheets, (_sheet: any, sheetName: string) => {
      this.forEachInSheet(sheetName, callback);
    });
  }

  map<T>(callback: (cell: any) => T): T[] {
    const results: T[] = [];
    this.forEach((cell: any) => {
      results.push(callback(cell));
    });
    return results;
  }

  findSheet(address: any, create: boolean): any[] | undefined {
    const name = address.sheetName;
    if (this.sheets[name]) {
      return this.sheets[name];
    }
    if (create) {
      return (this.sheets[name] = []);
    }
    return undefined;
  }

  findSheetRow(sheet: any[] | undefined, address: any, create: boolean): any[] | undefined {
    const { row } = address;
    if (sheet && sheet[row]) {
      return sheet[row];
    }
    if (create && sheet) {
      return (sheet[row] = []);
    }
    return undefined;
  }

  findRowCell(row: any[] | undefined, address: any, create: boolean): any {
    const { col } = address;
    if (row && row[col]) {
      return row[col];
    }
    if (create && row) {
      return (row[col] = this.template
        ? Object.assign(address, JSON.parse(JSON.stringify(this.template)))
        : address);
    }
    return undefined;
  }

  spliceRows(sheetName: string, start: number, numDelete: number, numInsert: number): void {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      const inserts: any[] = [];
      for (let i = 0; i < numInsert; i++) {
        inserts.push([]);
      }
      sheet.splice(start, numDelete, ...inserts);
    }
  }

  spliceColumns(sheetName: string, start: number, numDelete: number, numInsert: number): void {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      const inserts: any[] = [];
      for (let i = 0; i < numInsert; i++) {
        inserts.push(null);
      }
      _.each(sheet, (row: any) => {
        if (row) {
          row.splice(start, numDelete, ...inserts);
        }
      });
    }
  }
}

export default CellMatrix;
