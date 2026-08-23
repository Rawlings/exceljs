import _ from '../utils/helpers/under-dash';
import colCache from '../utils/data/col-cache';
import type { DecodedExAddress } from '../utils/data/col-cache';
import { CellMatrix } from '../utils/data/cell-matrix';
import type { MatrixCell } from '../utils/data/cell-matrix';
import { Range } from './range';

const rangeRegexp = /[$](\w+)[$](\d+)(:[$](\w+)[$](\d+))?/;

export interface DefinedNameRanges {
  name: string;
  ranges: string[];
}

export type DefinedNamesRanges = DefinedNameRanges;

export type DefinedNamesModel = DefinedNameRanges[];

export class DefinedNames {
  matrixMap: Record<string, CellMatrix | undefined>;

  constructor() {
    this.matrixMap = {};
  }

  getMatrix(name: string): CellMatrix {
    let matrix = this.matrixMap[name];
    if (!matrix) {
      matrix = new CellMatrix(undefined);
      this.matrixMap[name] = matrix;
    }
    return matrix;
  }

  // add a name to a cell. locStr in the form SheetName!$col$row or SheetName!$c1$r1:$c2:$r2
  add(locStr: string, name: string) {
    const location = colCache.decodeEx(locStr);
    this.addEx(location, name);
  }

  addEx(location: DecodedExAddress, name: string) {
    const matrix = this.getMatrix(name);
    const top = location.top;
    const left = location.left;
    const right = location.right;
    const bottom = location.bottom;
    if (
      typeof top === 'number' &&
      typeof left === 'number' &&
      typeof right === 'number' &&
      typeof bottom === 'number'
    ) {
      const sheetName = location.sheetName ?? '';
      for (let col = left; col <= right; col++) {
        for (let row = top; row <= bottom; row++) {
          const address = {
            sheetName,
            address: colCache.n2l(col) + row,
            row,
            col,
          };

          matrix.addCellEx(address);
        }
      }
    } else {
      matrix.addCellEx(location);
    }
  }

  remove(locStr: string, name: string) {
    const location = colCache.decodeEx(locStr);
    this.removeEx(location, name);
  }

  removeEx(location: DecodedExAddress, name: string) {
    const matrix = this.getMatrix(name);
    matrix.removeCellEx(location);
  }

  removeAllNames(location: DecodedExAddress) {
    Object.values(this.matrixMap).forEach((matrix) => {
      if (matrix) {
        matrix.removeCellEx(location);
      }
    });
  }

  forEach(callback: (name: string, cell: MatrixCell) => void) {
    Object.entries(this.matrixMap).forEach(([name, matrix]) => {
      if (matrix) {
        matrix.forEach((cell) => {
          callback(name, cell);
        });
      }
    });
  }

  // get all the names of a cell
  getNames(addressStr: string): string[] {
    return this.getNamesEx(colCache.decodeEx(addressStr));
  }

  getNamesEx(address: DecodedExAddress): string[] {
    const names: string[] = [];
    Object.keys(this.matrixMap).forEach((name) => {
      const matrix = this.matrixMap[name];
      if (matrix?.findCellEx(address, false)) {
        names.push(name);
      }
    });
    return names;
  }

  _explore(matrix: CellMatrix, cell: MatrixCell): Range {
    cell.mark = false;
    const { sheetName } = cell;

    const range = new Range(cell.row, cell.col, cell.row, cell.col, sheetName);
    let x;
    let y;

    // grow vertical - only one col to worry about
    function vGrow(yy: number, edge: 'top' | 'bottom') {
      const c = matrix.findCellAt(sheetName, yy, cell.col);
      if (!c?.mark) {
        return false;
      }
      range[edge] = yy;
      c.mark = false;
      return true;
    }
    for (y = cell.row - 1; vGrow(y, 'top'); y--);
    for (y = cell.row + 1; vGrow(y, 'bottom'); y++);

    // grow horizontal - ensure all rows can grow
    function hGrow(xx: number, edge: 'left' | 'right') {
      const cells: MatrixCell[] = [];
      for (y = range.top; y <= range.bottom; y++) {
        const c = matrix.findCellAt(sheetName, y, xx);
        if (c?.mark) {
          cells.push(c);
        } else {
          return false;
        }
      }
      range[edge] = xx;
      for (let i = 0; i < cells.length; i++) {
        cells[i].mark = false;
      }
      return true;
    }
    for (x = cell.col - 1; hGrow(x, 'left'); x--);
    for (x = cell.col + 1; hGrow(x, 'right'); x++);

    return range;
  }

  getRanges(name: string, matrixParam?: CellMatrix): DefinedNameRanges {
    const matrix = matrixParam ?? this.matrixMap[name];

    if (!matrix) {
      return { name, ranges: [] };
    }

    // mark and sweep!
    matrix.forEach((cell) => {
      cell.mark = true;
    });
    const ranges: string[] = [];
    matrix.forEach((cell) => {
      if (cell.mark) {
        const range = this._explore(matrix, cell);
        ranges.push(range.$shortRange);
      }
    });

    return {
      name,
      ranges,
    };
  }

  normaliseMatrix(matrix: CellMatrix, sheetName: string) {
    // some of the cells might have shifted on specified sheet
    // need to reassign rows, cols
    matrix.forEachInSheet(sheetName, (cell, row, col) => {
      if (cell.row !== row || cell.col !== col) {
        cell.row = row;
        cell.col = col;
        cell.address = colCache.n2l(col) + row;
      }
    });
  }

  spliceRows(sheetName: string, start: number, numDelete: number, numInsert: number) {
    Object.values(this.matrixMap).forEach((matrix) => {
      if (matrix) {
        matrix.spliceRows(sheetName, start, numDelete, numInsert);
        this.normaliseMatrix(matrix, sheetName);
      }
    });
  }

  spliceColumns(sheetName: string, start: number, numDelete: number, numInsert: number) {
    Object.values(this.matrixMap).forEach((matrix) => {
      if (matrix) {
        matrix.spliceColumns(sheetName, start, numDelete, numInsert);
        this.normaliseMatrix(matrix, sheetName);
      }
    });
  }

  get model(): DefinedNamesModel {
    // To get names per cell - just iterate over all names finding cells if they exist
    return Object.entries(this.matrixMap)
      .map(([name, matrix]) => (matrix ? this.getRanges(name, matrix) : { name, ranges: [] }))
      .filter((definedName) => definedName.ranges.length > 0);
  }

  set model(value: DefinedNamesModel | undefined) {
    // value is [ { name, ranges }, ... ]
    const matrixMap: Record<string, CellMatrix> = (this.matrixMap = {});
    if (value && Array.isArray(value)) {
      value.forEach((definedName) => {
        const matrix = (matrixMap[definedName.name] = new CellMatrix(undefined));
        definedName.ranges.forEach((rangeStr) => {
          if (rangeRegexp.test(rangeStr.split('!').pop() ?? '')) {
            matrix.addCell(rangeStr);
          }
        });
      });
    }
  }
}

export default DefinedNames;
