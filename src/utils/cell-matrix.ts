import _ from './under-dash';
import colCache from './col-cache';

class CellMatrix {
  template: any;
  sheets: any;

  constructor(template?: any) {
    this.template = template;
    this.sheets = {};
  }

  addCell(addressStr: any) {
    this.addCellEx(colCache.decodeEx(addressStr));
  }

  getCell(addressStr: any) {
    return this.findCellEx(colCache.decodeEx(addressStr), true);
  }

  findCell(addressStr: any) {
    return this.findCellEx(colCache.decodeEx(addressStr), false);
  }

  findCellAt(sheetName: any, rowNumber: any, colNumber: any) {
    const sheet = this.sheets[sheetName];
    const row = sheet && sheet[rowNumber];
    return row && row[colNumber];
  }

  addCellEx(address: any) {
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

  getCellEx(address: any) {
    return this.findCellEx(address, true);
  }

  findCellEx(address: any, create: any) {
    const sheet = this.findSheet(address, create);
    const row = this.findSheetRow(sheet, address, create);
    return this.findRowCell(row, address, create);
  }

  getCellAt(sheetName: any, rowNumber: any, colNumber: any) {
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

  removeCellEx(address: any) {
    const sheet = this.findSheet(address, false);
    if (!sheet) {
      return;
    }
    const row = this.findSheetRow(sheet, address, false);
    if (!row) {
      return;
    }
    delete row[address.col];
  }

  forEachInSheet(sheetName: any, callback: any) {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      sheet.forEach((row: any, rowNumber: any) => {
        if (row) {
          row.forEach((cell: any, colNumber: any) => {
            if (cell) {
              callback(cell, rowNumber, colNumber);
            }
          });
        }
      });
    }
  }

  forEach(callback: any) {
    _.each(this.sheets, (sheet: any, sheetName: any) => {
      this.forEachInSheet(sheetName, callback);
    });
  }

  map(callback: any) {
    const results: any[] = [];
    this.forEach((cell: any) => {
      results.push(callback(cell));
    });
    return results;
  }

  findSheet(address: any, create: any) {
    const name = address.sheetName;
    if (this.sheets[name]) {
      return this.sheets[name];
    }
    if (create) {
      return (this.sheets[name] = []);
    }
    return undefined;
  }

  findSheetRow(sheet: any, address: any, create: any) {
    const { row } = address;
    if (sheet && sheet[row]) {
      return sheet[row];
    }
    if (create) {
      return (sheet[row] = []);
    }
    return undefined;
  }

  findRowCell(row: any, address: any, create: any) {
    const { col } = address;
    if (row && row[col]) {
      return row[col];
    }
    if (create) {
      return (row[col] = this.template
        ? Object.assign(address, JSON.parse(JSON.stringify(this.template)))
        : address);
    }
    return undefined;
  }

  spliceRows(sheetName: any, start: any, numDelete: any, numInsert: any) {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      const inserts = [];
      for (let i = 0; i < numInsert; i++) {
        inserts.push([]);
      }
      sheet.splice(start, numDelete, ...inserts);
    }
  }

  spliceColumns(sheetName: any, start: any, numDelete: any, numInsert: any) {
    const sheet = this.sheets[sheetName];
    if (sheet) {
      const inserts: any[] = [];
      for (let i = 0; i < numInsert; i++) {
        inserts.push(null);
      }
      _.each(sheet, (row: any) => {
        row.splice(start, numDelete, ...inserts);
      });
    }
  }
}

export default CellMatrix;
