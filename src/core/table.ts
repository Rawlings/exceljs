import colCache from '../utils/data/col-cache';
import type { WorksheetLike, CellLike } from './internal-types';
import type { Style } from './cell';

export interface TableStyleProperties {
  theme?: string;
  name?: string;
  showFirstColumn?: boolean;
  showLastColumn?: boolean;
  showRowStripes?: boolean;
  showColumnStripes?: boolean;
}

export interface TableColumnProperties {
  name: string;
  filterButton?: boolean;
  totalsRowLabel?: string;
  totalsRowFunction?:
    | 'none'
    | 'average'
    | 'countNums'
    | 'count'
    | 'max'
    | 'min'
    | 'stdDev'
    | 'var'
    | 'sum'
    | 'custom';
  totalsRowFormula?: string;
  totalsRowResult?: unknown;
  style?: Partial<Style>;
}

export interface TableProperties {
  name: string;
  displayName?: string;
  displyName?: string;
  ref: string;
  headerRow?: boolean;
  totalsRow?: boolean;
  style?: TableStyleProperties;
  columns: TableColumnProperties[];
  // any[][]: matches the public API contract in fixtures/parity.d.ts (rows are heterogeneous cell values)
  // oxlint-disable-next-line typescript/no-explicit-any
  rows: any[][];
  tl?: { row: number; col: number };
  autoFilterRef?: string;
  tableRef?: string;
}

export type TableColumn = Required<TableColumnProperties>;

interface TableCacheState {
  ref: string;
  width: number;
  tableHeight: number;
}

class Column {
  // wrapper around column model, allowing access and manipulation
  table: Table;
  column: TableColumn | TableColumnProperties;
  index: number;

  constructor(table: Table, column: TableColumn | TableColumnProperties, index: number) {
    this.table = table;
    this.column = column;
    this.index = index;
  }

  _set<K extends keyof TableColumnProperties>(name: K, value: TableColumnProperties[K]) {
    this.table.cacheState();
    this.column[name] = value;
  }

  get name() {
    return this.column.name;
  }
  set name(value: string) {
    this._set('name', value);
  }

  get filterButton() {
    return this.column.filterButton;
  }
  set filterButton(value: boolean | undefined) {
    this.column.filterButton = value;
  }

  get style(): Partial<Style> | undefined {
    return this.column.style;
  }
  set style(value: Partial<Style> | undefined) {
    this.column.style = value;
  }

  get totalsRowLabel() {
    return this.column.totalsRowLabel;
  }
  set totalsRowLabel(value: string | undefined) {
    this._set('totalsRowLabel', value);
  }

  get totalsRowFunction() {
    return this.column.totalsRowFunction;
  }
  set totalsRowFunction(value: TableColumnProperties['totalsRowFunction']) {
    this._set('totalsRowFunction', value);
  }

  get totalsRowResult() {
    return this.column.totalsRowResult;
  }
  set totalsRowResult(value: unknown) {
    this._set('totalsRowResult', value);
  }

  get totalsRowFormula() {
    return this.column.totalsRowFormula;
  }
  set totalsRowFormula(value: string | undefined) {
    this._set('totalsRowFormula', value);
  }
}

function assert(test: unknown, message: string): asserts test {
  if (!test) {
    throw new Error(message);
  }
}

function assignStyle(cell: CellLike, style: Partial<Style> | undefined) {
  if (style) {
    Object.assign(cell.style, style);
  }
}

export class Table {
  worksheet: WorksheetLike;
  // only assigned when a model is passed to the constructor — matches
  // original loose-typed behavior where callers are trusted to follow up
  // with `.model = ...` if they didn't pass one initially.
  table!: TableProperties;
  _cache: TableCacheState | undefined;

  constructor(worksheet: WorksheetLike, table?: TableProperties) {
    this.worksheet = worksheet;
    if (table) {
      this.table = table;
      // check things are ok first
      this.validate();

      this.store();
    }
  }

  getFormula(column: TableColumnProperties): string | null {
    // get the correct formula to apply to the totals row
    switch (column.totalsRowFunction) {
      case 'none':
      case undefined:
        return null;
      case 'average':
        return `SUBTOTAL(101,${this.table.name}[${column.name}])`;
      case 'countNums':
        return `SUBTOTAL(102,${this.table.name}[${column.name}])`;
      case 'count':
        return `SUBTOTAL(103,${this.table.name}[${column.name}])`;
      case 'max':
        return `SUBTOTAL(104,${this.table.name}[${column.name}])`;
      case 'min':
        return `SUBTOTAL(105,${this.table.name}[${column.name}])`;
      case 'stdDev':
        return `SUBTOTAL(106,${this.table.name}[${column.name}])`;
      case 'var':
        return `SUBTOTAL(107,${this.table.name}[${column.name}])`;
      case 'sum':
        return `SUBTOTAL(109,${this.table.name}[${column.name}])`;
      case 'custom':
        return column.totalsRowFormula ?? '';
      default:
        throw new Error(`Invalid Totals Row Function: ${String(column.totalsRowFunction)}`);
    }
  }

  get width() {
    // width of the table
    return this.table.columns.length;
  }

  get height() {
    // height of the table data
    return this.table.rows.length;
  }

  get filterHeight() {
    // height of the table data plus optional header row
    return this.height + (this.table.headerRow ? 1 : 0);
  }

  get tableHeight() {
    // full height of the table on the sheet
    return this.filterHeight + (this.table.totalsRow ? 1 : 0);
  }

  validate() {
    const { table } = this;
    if (!table.ref && table.tableRef) {
      table.ref = table.tableRef;
    }
    table.headerRow ??= true;
    table.totalsRow ??= false;
    table.rows ??= [];

    table.style ??= {};
    const { style } = table;
    style.theme ??= 'TableStyleMedium2';
    style.showFirstColumn ??= false;
    style.showLastColumn ??= false;
    style.showRowStripes ??= false;
    style.showColumnStripes ??= false;

    assert(table.ref, 'Table must have ref');
    assert(table.columns, 'Table must have column definitions');

    table.tl = colCache.decodeAddress(table.ref);
    const { row, col } = table.tl;
    assert(row > 0, 'Table must be on valid row');
    assert(col > 0, 'Table must be on valid col');

    const { width, filterHeight, tableHeight } = this;

    // autoFilterRef is a range that includes optional headers only
    table.autoFilterRef = colCache.encode(row, col, row + filterHeight - 1, col + width - 1);

    // tableRef is a range that includes optional headers and totals
    table.tableRef = colCache.encode(row, col, row + tableHeight - 1, col + width - 1);

    table.columns.forEach((column, i) => {
      assert(column.name, `Column ${i} must have a name`);
      if (i === 0) {
        column.totalsRowLabel ??= 'Total';
      } else {
        column.totalsRowFunction ??= 'none';
        column.totalsRowFormula = this.getFormula(column) ?? undefined;
      }
    });
  }

  store() {
    // where the table needs to store table data, headers, footers in
    // the sheet...

    const { worksheet, table } = this;
    const { row, col } = table.tl ?? { row: 1, col: 1 };
    let count = 0;
    if (table.headerRow) {
      const r = worksheet.getRow!(row + count++);
      table.columns.forEach((column, j) => {
        const { style, name } = column;
        const cell = r.getCell(col + j);
        cell.value = name;
        assignStyle(cell, style);
      });
    }
    table.rows.forEach((data: unknown[]) => {
      const r = worksheet.getRow!(row + count++);
      data.forEach((value, j) => {
        const cell = r.getCell(col + j);
        cell.value = value;

        assignStyle(cell, table.columns[j].style);
      });
    });

    if (table.totalsRow) {
      const r = worksheet.getRow!(row + count++);
      table.columns.forEach((column, j) => {
        const cell = r.getCell(col + j);
        if (j === 0) {
          cell.value = column.totalsRowLabel;
        } else {
          const formula = this.getFormula(column);
          if (formula) {
            cell.value = {
              formula: column.totalsRowFormula,
              result: column.totalsRowResult,
            };
          } else {
            cell.value = null;
          }
        }

        assignStyle(cell, column.style);
      });
    }
  }

  load(worksheet: WorksheetLike) {
    // where the table will read necessary features from a loaded sheet
    const { table } = this;
    const { row, col } = table.tl ?? { row: 1, col: 1 };
    let count = 0;
    if (table.headerRow) {
      const r = worksheet.getRow!(row + count++);
      table.columns.forEach((column, j) => {
        const cell = r.getCell(col + j);
        cell.value = column.name;
      });
    }
    table.rows.forEach((data: unknown[]) => {
      const r = worksheet.getRow!(row + count++);
      data.forEach((value, j) => {
        const cell = r.getCell(col + j);
        cell.value = value;
      });
    });

    if (table.totalsRow) {
      const r = worksheet.getRow!(row + count++);
      table.columns.forEach((column, j) => {
        const cell = r.getCell(col + j);
        if (j === 0) {
          cell.value = column.totalsRowLabel;
        } else {
          const formula = this.getFormula(column);
          if (formula) {
            cell.value = {
              formula: column.totalsRowFormula,
              result: column.totalsRowResult,
            };
          }
        }
      });
    }
  }

  get model() {
    return this.table;
  }

  set model(value: TableProperties) {
    this.table = value;
  }

  // ================================================================
  // TODO: Mutating methods
  cacheState() {
    this._cache ??= {
      ref: this.ref,
      width: this.width,
      tableHeight: this.tableHeight,
    };
  }

  commit() {
    // changes may have been made that might have on-sheet effects
    if (!this._cache) {
      return;
    }

    // check things are ok first
    this.validate();

    const ref = colCache.decodeAddress(this._cache.ref);
    if (this.ref !== this._cache.ref) {
      // wipe out whole table footprint at previous location
      for (let i = 0; i < this._cache.tableHeight; i++) {
        const row = this.worksheet.getRow!(ref.row + i);
        for (let j = 0; j < this._cache.width; j++) {
          const cell = row.getCell(ref.col + j);
          cell.value = null;
        }
      }
    } else {
      // clear out below table if it has shrunk
      for (let i = this.tableHeight; i < this._cache.tableHeight; i++) {
        const row = this.worksheet.getRow!(ref.row + i);
        for (let j = 0; j < this._cache.width; j++) {
          const cell = row.getCell(ref.col + j);
          cell.value = null;
        }
      }

      // clear out to right of table if it has lost columns
      for (let i = 0; i < this.tableHeight; i++) {
        const row = this.worksheet.getRow!(ref.row + i);
        for (let j = this.width; j < this._cache.width; j++) {
          const cell = row.getCell(ref.col + j);
          cell.value = null;
        }
      }
    }

    this.store();
  }

  addRow(values: unknown[], rowNumber?: number) {
    // Add a row of data, either insert at rowNumber or append
    this.cacheState();

    if (rowNumber === undefined) {
      this.table.rows.push(values);
    } else {
      this.table.rows.splice(rowNumber, 0, values);
    }
  }

  removeRows(rowIndex: number, count: number = 1) {
    // Remove a rows of data
    this.cacheState();
    this.table.rows.splice(rowIndex, count);
  }

  getColumn(colIndex: number): Column {
    const column = this.table.columns[colIndex];
    return new Column(this, column, colIndex);
  }

  addColumn(column: TableColumnProperties, values: unknown[], colIndex?: number) {
    // Add a new column, including column defn and values
    // Inserts at colNumber or adds to the right
    this.cacheState();

    if (colIndex === undefined) {
      this.table.columns.push(column);
      this.table.rows.forEach((row, i) => {
        row.push(values[i]);
      });
    } else {
      this.table.columns.splice(colIndex, 0, column);
      this.table.rows.forEach((row, i) => {
        row.splice(colIndex, 0, values[i]);
      });
    }
  }

  removeColumns(colIndex: number, count: number = 1) {
    // Remove a column with data
    this.cacheState();

    this.table.columns.splice(colIndex, count);
    this.table.rows.forEach((row) => {
      row.splice(colIndex, count);
    });
  }

  _assign<K extends keyof TableProperties>(prop: K, value: TableProperties[K]) {
    this.cacheState();
    this.table[prop] = value;
  }

  _assignStyle<K extends keyof TableStyleProperties>(prop: K, value: TableStyleProperties[K]) {
    this.cacheState();
    this.table.style ??= {};
    this.table.style[prop] = value;
  }

  get ref() {
    return this.table.ref;
  }
  set ref(value: string) {
    this._assign('ref', value);
  }

  get name() {
    return this.table.name;
  }
  set name(value: string) {
    this.table.name = value;
  }

  get displayName() {
    return this.table.displyName ?? this.table.name;
  }
  set displayName(value: string) {
    this.table.displayName = value;
  }

  get headerRow() {
    return this.table.headerRow;
  }
  set headerRow(value: boolean | undefined) {
    this._assign('headerRow', value);
  }

  get totalsRow() {
    return this.table.totalsRow;
  }
  set totalsRow(value: boolean | undefined) {
    this._assign('totalsRow', value);
  }

  get theme() {
    return this.table.style?.name;
  }
  set theme(value: string | undefined) {
    this._assignStyle('name', value);
  }

  get showFirstColumn() {
    return this.table.style?.showFirstColumn;
  }
  set showFirstColumn(value: boolean | undefined) {
    this._assignStyle('showFirstColumn', value);
  }

  get showLastColumn() {
    return this.table.style?.showLastColumn;
  }
  set showLastColumn(value: boolean | undefined) {
    this._assignStyle('showLastColumn', value);
  }

  get showRowStripes() {
    return this.table.style?.showRowStripes;
  }
  set showRowStripes(value: boolean | undefined) {
    this._assignStyle('showRowStripes', value);
  }

  get showColumnStripes() {
    return this.table.style?.showColumnStripes;
  }
  set showColumnStripes(value: boolean | undefined) {
    this._assignStyle('showColumnStripes', value);
  }
}

export default Table;
