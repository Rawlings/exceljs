import _ from '#src/utils/helpers/under-dash';
import colCache from '#src/utils/data/col-cache';
import type { DecodedExAddress } from '#src/utils/data/col-cache';

export interface MatrixCell {
  sheetName: string;
  address: string;
  row: number;
  col: number;
  mark?: boolean;
  [key: string]: unknown;
}

type MatrixRow = (MatrixCell | undefined | null)[];
type MatrixSheet = (MatrixRow | undefined)[];

class CellMatrix {
  template: Record<string, unknown> | undefined;
  sheets: Record<string, MatrixSheet>;

  constructor(template?: Record<string, unknown>) {
    this.template = template;
    this.sheets = {};
  }

  addCell(addressStr: string): void {
    this.addCellEx(colCache.decodeEx(addressStr));
  }

  getCell(addressStr: string): MatrixCell {
    return this.findCellEx(colCache.decodeEx(addressStr), true);
  }

  findCell(addressStr: string): MatrixCell | undefined {
    return this.findCellEx(colCache.decodeEx(addressStr), false);
  }

  findCellAt(
    sheetName: string,
    rowNumber: number,
    colNumber: number
  ): MatrixCell | undefined | null {
    const sheet = this.sheets[sheetName];
    const row = sheet && sheet[rowNumber];
    return row && row[colNumber];
  }

  addCellEx(address: DecodedExAddress): void {
    if (address.top) {
      for (let row = address.top; row <= (address.bottom as number); row++) {
        for (let col = address.left as number; col <= (address.right as number); col++) {
          this.getCellAt(address.sheetName as string, row, col);
        }
      }
    } else {
      this.findCellEx(address, true);
    }
  }

  getCellEx(address: DecodedExAddress): MatrixCell {
    return this.findCellEx(address, true);
  }

  findCellEx(address: DecodedExAddress, create: boolean): MatrixCell {
    const sheet = this.findSheet(address, create);
    const row = this.findSheetRow(sheet, address, create);
    return this.findRowCell(row, address, create) as MatrixCell;
  }

  getCellAt(sheetName: string, rowNumber: number, colNumber: number): MatrixCell {
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

  removeCellEx(address: DecodedExAddress): void {
    const sheet = this.findSheet(address, false);
    if (!sheet) return;
    const row = this.findSheetRow(sheet, address, false);
    if (!row) return;
    delete row[address.col as number];
  }

  forEachInSheet(
    sheetName: string,
    callback: (cell: MatrixCell, rowNumber: number, colNumber: number) => void
  ): void {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      sheet.forEach((row, rowNumber: number) => {
        if (row) {
          row.forEach((cell, colNumber: number) => {
            if (cell) {
              callback(cell, rowNumber, colNumber);
            }
          });
        }
      });
    }
  }

  forEach(callback: (cell: MatrixCell, rowNumber: number, colNumber: number) => void): void {
    _.each(this.sheets, (_sheet: MatrixSheet, sheetName: string) => {
      this.forEachInSheet(sheetName, callback);
    });
  }

  map<T>(callback: (cell: MatrixCell) => T): T[] {
    const results: T[] = [];
    this.forEach((cell) => {
      results.push(callback(cell));
    });
    return results;
  }

  findSheet(address: DecodedExAddress, create: boolean): MatrixSheet | undefined {
    const name = address.sheetName as string;
    if (this.sheets[name]) {
      return this.sheets[name];
    }
    if (create) {
      return (this.sheets[name] = []);
    }
    return undefined;
  }

  findSheetRow(
    sheet: MatrixSheet | undefined,
    address: DecodedExAddress,
    create: boolean
  ): MatrixRow | undefined {
    const { row } = address as { row: number };
    if (sheet && sheet[row]) {
      return sheet[row];
    }
    if (create && sheet) {
      return (sheet[row] = []);
    }
    return undefined;
  }

  findRowCell(
    row: MatrixRow | undefined,
    address: DecodedExAddress,
    create: boolean
  ): MatrixCell | undefined {
    const { col } = address as { col: number };
    if (row && row[col]) {
      return row[col];
    }
    if (create && row) {
      return (row[col] = this.template
        ? (Object.assign(address, JSON.parse(JSON.stringify(this.template))) as MatrixCell)
        : (address as unknown as MatrixCell));
    }
    return undefined;
  }

  spliceRows(sheetName: string, start: number, numDelete: number, numInsert: number): void {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      const inserts: MatrixRow[] = [];
      for (let i = 0; i < numInsert; i++) {
        inserts.push([]);
      }
      sheet.splice(start, numDelete, ...inserts);
    }
  }

  spliceColumns(sheetName: string, start: number, numDelete: number, numInsert: number): void {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      const inserts: null[] = [];
      for (let i = 0; i < numInsert; i++) {
        inserts.push(null);
      }
      _.each(sheet, (row: MatrixRow | undefined) => {
        if (row) {
          row.splice(start, numDelete, ...inserts);
        }
      });
    }
  }
}

export default CellMatrix;
