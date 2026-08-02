import _ from '#src/utils/helpers/under-dash';
import colCache from '#src/utils/data/col-cache';
import CellMatrix from '#src/utils/data/cell-matrix';
import Range from '#src/models/range';

const rangeRegexp = /[$](\w+)[$](\d+)(:[$](\w+)[$](\d+))?/;

class DefinedNames {
  matrixMap: any;

  constructor() {
    this.matrixMap = {};
  }

  getMatrix(name: any) {
    const matrix = this.matrixMap[name] || (this.matrixMap[name] = new CellMatrix(undefined));
    return matrix;
  }

  // add a name to a cell. locStr in the form SheetName!$col$row or SheetName!$c1$r1:$c2:$r2
  add(locStr: any, name: any) {
    const location = colCache.decodeEx(locStr);
    this.addEx(location, name);
  }

  addEx(location: any, name: any) {
    const matrix = this.getMatrix(name);
    if (location.top) {
      for (let col = location.left; col <= location.right; col++) {
        for (let row = location.top; row <= location.bottom; row++) {
          const address = {
            sheetName: location.sheetName,
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

  remove(locStr: any, name: any) {
    const location = colCache.decodeEx(locStr);
    this.removeEx(location, name);
  }

  removeEx(location: any, name: any) {
    const matrix = this.getMatrix(name);
    matrix.removeCellEx(location);
  }

  removeAllNames(location: any) {
    _.each(this.matrixMap, (matrix: any) => {
      matrix.removeCellEx(location);
    });
  }

  forEach(callback: any) {
    _.each(this.matrixMap, (matrix: any, name: any) => {
      matrix.forEach((cell: any) => {
        callback(name, cell);
      });
    });
  }

  // get all the names of a cell
  getNames(addressStr: any) {
    return this.getNamesEx(colCache.decodeEx(addressStr));
  }

  getNamesEx(address: any) {
    return _.map(
      this.matrixMap,
      (matrix: any, name: any) => matrix.findCellEx(address) && name
    ).filter(Boolean);
  }

  _explore(matrix: any, cell: any) {
    cell.mark = false;
    const { sheetName } = cell;

    const range = new Range(cell.row, cell.col, cell.row, cell.col, sheetName);
    let x;
    let y;

    // grow vertical - only one col to worry about
    function vGrow(yy: any, edge: any) {
      const c = matrix.findCellAt(sheetName, yy, cell.col);
      if (!c || !c.mark) {
        return false;
      }
      (range as any)[edge] = yy;
      c.mark = false;
      return true;
    }
    for (y = cell.row - 1; vGrow(y, 'top'); y--);
    for (y = cell.row + 1; vGrow(y, 'bottom'); y++);

    // grow horizontal - ensure all rows can grow
    function hGrow(xx: any, edge: any) {
      const cells = [];
      for (y = range.top; y <= range.bottom; y++) {
        const c = matrix.findCellAt(sheetName, y, xx);
        if (c && c.mark) {
          cells.push(c);
        } else {
          return false;
        }
      }
      (range as any)[edge] = xx;
      for (let i = 0; i < cells.length; i++) {
        cells[i].mark = false;
      }
      return true;
    }
    for (x = cell.col - 1; hGrow(x, 'left'); x--);
    for (x = cell.col + 1; hGrow(x, 'right'); x++);

    return range;
  }

  getRanges(name: any, matrix?: any) {
    matrix = matrix || this.matrixMap[name];

    if (!matrix) {
      return { name, ranges: [] };
    }

    // mark and sweep!
    matrix.forEach((cell: any) => {
      cell.mark = true;
    });
    const ranges = matrix
      .map((cell: any) => cell.mark && this._explore(matrix, cell))
      .filter(Boolean)
      .map((range: any) => range.$shortRange);

    return {
      name,
      ranges,
    };
  }

  normaliseMatrix(matrix: any, sheetName: any) {
    // some of the cells might have shifted on specified sheet
    // need to reassign rows, cols
    matrix.forEachInSheet(sheetName, (cell: any, row: any, col: any) => {
      if (cell) {
        if (cell.row !== row || cell.col !== col) {
          cell.row = row;
          cell.col = col;
          cell.address = colCache.n2l(col) + row;
        }
      }
    });
  }

  spliceRows(sheetName: any, start: any, numDelete: any, numInsert: any) {
    _.each(this.matrixMap, (matrix: any) => {
      matrix.spliceRows(sheetName, start, numDelete, numInsert);
      this.normaliseMatrix(matrix, sheetName);
    });
  }

  spliceColumns(sheetName: any, start: any, numDelete: any, numInsert: any) {
    _.each(this.matrixMap, (matrix: any) => {
      matrix.spliceColumns(sheetName, start, numDelete, numInsert);
      this.normaliseMatrix(matrix, sheetName);
    });
  }

  get model() {
    // To get names per cell - just iterate over all names finding cells if they exist
    return _.map(this.matrixMap, (matrix: any, name: any) => this.getRanges(name, matrix)).filter(
      (definedName) => definedName.ranges.length
    );
  }

  set model(value: any) {
    // value is [ { name, ranges }, ... ]
    const matrixMap = (this.matrixMap = {});
    if (value && Array.isArray(value)) {
      value.forEach((definedName: any) => {
        const matrix = ((matrixMap as any)[definedName.name] = new CellMatrix(undefined));
        definedName.ranges.forEach((rangeStr: any) => {
          if (rangeRegexp.test(rangeStr.split('!').pop() || '')) {
            matrix.addCell(rangeStr);
          }
        });
      });
    }
  }
}

export default DefinedNames;
