import _ from '#src/utils/helpers/under-dash';
import colCache from '#src/utils/data/col-cache';
import type { DecodedExAddress } from '#src/utils/data/col-cache';
import CellMatrix from '#src/utils/data/cell-matrix';
import type { MatrixCell } from '#src/utils/data/cell-matrix';
import Range from '#src/models/range';

const rangeRegexp = /[$](\w+)[$](\d+)(:[$](\w+)[$](\d+))?/;

export interface DefinedNameRanges {
  name: string;
  ranges: string[];
}

class DefinedNames {
  matrixMap: Record<string, CellMatrix>;

  constructor() {
    this.matrixMap = {};
  }

  getMatrix(name: string): CellMatrix {
    const matrix = this.matrixMap[name] || (this.matrixMap[name] = new CellMatrix(undefined));
    return matrix;
  }

  // add a name to a cell. locStr in the form SheetName!$col$row or SheetName!$c1$r1:$c2:$r2
  add(locStr: string, name: string) {
    const location = colCache.decodeEx(locStr);
    this.addEx(location, name);
  }

  addEx(location: DecodedExAddress, name: string) {
    const matrix = this.getMatrix(name);
    if (location.top) {
      for (let col = location.left as number; col <= (location.right as number); col++) {
        for (let row = location.top; row <= (location.bottom as number); row++) {
          const address = {
            sheetName: location.sheetName as string,
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
    _.each(this.matrixMap, (matrix: CellMatrix) => {
      matrix.removeCellEx(location);
    });
  }

  forEach(callback: (name: string, cell: MatrixCell) => void) {
    _.each(this.matrixMap, (matrix: CellMatrix, name: string) => {
      matrix.forEach((cell) => {
        callback(name, cell);
      });
    });
  }

  // get all the names of a cell
  getNames(addressStr: string): string[] {
    return this.getNamesEx(colCache.decodeEx(addressStr));
  }

  getNamesEx(address: DecodedExAddress): string[] {
    return _.map(
      this.matrixMap,
      (matrix: CellMatrix, name: string) => matrix.findCellEx(address, false) && name
    ).filter(Boolean);
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
      if (!c || !c.mark) {
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
        if (c && c.mark) {
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

  getRanges(name: string, matrix?: CellMatrix): DefinedNameRanges {
    matrix = matrix || this.matrixMap[name];

    if (!matrix) {
      return { name, ranges: [] };
    }

    // mark and sweep!
    matrix.forEach((cell) => {
      cell.mark = true;
    });
    const ranges = matrix
      .map((cell) => cell.mark && this._explore(matrix as CellMatrix, cell))
      .filter(Boolean)
      .map((range) => (range as Range).$shortRange);

    return {
      name,
      ranges,
    };
  }

  normaliseMatrix(matrix: CellMatrix, sheetName: string) {
    // some of the cells might have shifted on specified sheet
    // need to reassign rows, cols
    matrix.forEachInSheet(sheetName, (cell, row, col) => {
      if (cell) {
        if (cell.row !== row || cell.col !== col) {
          cell.row = row;
          cell.col = col;
          cell.address = colCache.n2l(col) + row;
        }
      }
    });
  }

  spliceRows(sheetName: string, start: number, numDelete: number, numInsert: number) {
    _.each(this.matrixMap, (matrix: CellMatrix) => {
      matrix.spliceRows(sheetName, start, numDelete, numInsert);
      this.normaliseMatrix(matrix, sheetName);
    });
  }

  spliceColumns(sheetName: string, start: number, numDelete: number, numInsert: number) {
    _.each(this.matrixMap, (matrix: CellMatrix) => {
      matrix.spliceColumns(sheetName, start, numDelete, numInsert);
      this.normaliseMatrix(matrix, sheetName);
    });
  }

  get model(): DefinedNameRanges[] {
    // To get names per cell - just iterate over all names finding cells if they exist
    return _.map(this.matrixMap, (matrix: CellMatrix, name: string) =>
      this.getRanges(name, matrix)
    ).filter((definedName) => definedName.ranges.length);
  }

  set model(value: DefinedNameRanges[] | undefined) {
    // value is [ { name, ranges }, ... ]
    const matrixMap: Record<string, CellMatrix> = (this.matrixMap = {});
    if (value && Array.isArray(value)) {
      value.forEach((definedName) => {
        const matrix = (matrixMap[definedName.name] = new CellMatrix(undefined));
        definedName.ranges.forEach((rangeStr) => {
          if (rangeRegexp.test(rangeStr.split('!').pop() || '')) {
            matrix.addCell(rangeStr);
          }
        });
      });
    }
  }
}

export default DefinedNames;
