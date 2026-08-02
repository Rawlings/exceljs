/* eslint-disable max-classes-per-file */
import colCache from '../utils/data/col-cache';
import type { WorksheetLike, CellLike } from './internal-types';
import type { Style } from './cell';

export interface TableStyleProperties {
  theme?: string;
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
  ref: string;
  headerRow?: boolean;
  totalsRow?: boolean;
  style?: TableStyleProperties;
  columns: TableColumnProperties[];
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

  _set(name: keyof TableColumnProperties, value: unknown) {
    this.table.cacheState();
    (this.column as unknown as Record<string, unknown>)[name] = value;
  }

  /* eslint-disable lines-between-class-members */
  get name(): string {
    return this.column.name;
  }
  set name(value: string) {
    this._set('name', value);
  }

  get filterButton(): boolean | undefined {
    return this.column.filterButton;
  }
  set filterButton(value: boolean | undefined) {
    this.column.filterButton = value;
  }

  get style(): Record<string, unknown> | undefined {
    return this.column.style;
  }
  set style(value: Record<string, unknown> | undefined) {
    this.column.style = value;
  }

  get totalsRowLabel(): string | undefined {
    return this.column.totalsRowLabel;
  }
  set totalsRowLabel(value: string | undefined) {
    this._set('totalsRowLabel', value);
  }

  get totalsRowFunction(): string | undefined {
    return this.column.totalsRowFunction;
  }
  set totalsRowFunction(value: string | undefined) {
    this._set('totalsRowFunction', value);
  }

  get totalsRowResult(): unknown {
    return this.column.totalsRowResult;
  }
  set totalsRowResult(value: unknown) {
    this._set('totalsRowResult', value);
  }

  get totalsRowFormula(): string | undefined {
    return this.column.totalsRowFormula;
  }
  set totalsRowFormula(value: string | undefined) {
    this._set('totalsRowFormula', value);
  }
  /* eslint-enable lines-between-class-members */
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
        return column.totalsRowFormula as string;
      default:
        throw new Error(`Invalid Totals Row Function: ${column.totalsRowFunction}`);
    }
  }

  get width(): number {
    // width of the table
    return this.table.columns.length;
  }

  get height(): number {
    // height of the table data
    return this.table.rows.length;
  }

  get filterHeight(): number {
    // height of the table data plus optional header row
    return this.height + (this.table.headerRow ? 1 : 0);
  }

  get tableHeight(): number {
    // full height of the table on the sheet
    return this.filterHeight + (this.table.totalsRow ? 1 : 0);
  }

  validate() {
    const { table } = this;
    const assign = (o: Record<string, unknown>, name: string, dflt: unknown) => {
      if (o[name] === undefined) {
        o[name] = dflt;
      }
    };
    if (!table.ref && (table as any).tableRef) {
      table.ref = (table as any).tableRef;
    }
    assign(table as unknown as Record<string, unknown>, 'headerRow', true);
    assign(table as unknown as Record<string, unknown>, 'totalsRow', false);

    assign(table as unknown as Record<string, unknown>, 'style', {});
    const style = table.style as Record<string, unknown>;
    assign(style, 'theme', 'TableStyleMedium2');
    assign(style, 'showFirstColumn', false);
    assign(style, 'showLastColumn', false);
    assign(style, 'showRowStripes', false);
    assign(style, 'showColumnStripes', false);

    const assert = (test: unknown, message: string) => {
      if (!test) {
        throw new Error(message);
      }
    };
    assert(table.ref, 'Table must have ref');
    assert(table.columns, 'Table must have column definitions');
    table.rows = table.rows || [];
    assert(table.rows, 'Table must have row definitions');

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
        assign(column as unknown as Record<string, unknown>, 'totalsRowLabel', 'Total');
      } else {
        assign(column as unknown as Record<string, unknown>, 'totalsRowFunction', 'none');
        column.totalsRowFormula = this.getFormula(column) as string;
      }
    });
  }

  store() {
    // where the table needs to store table data, headers, footers in
    // the sheet...
    const assignStyle = (cell: CellLike, style: Record<string, unknown> | undefined) => {
      if (style) {
        Object.keys(style).forEach((key) => {
          (cell.style as Record<string, unknown>)[key] = style[key];
        });
      }
    };

    const { worksheet, table } = this;
    const { row, col } = table.tl as { row: number; col: number };
    let count = 0;
    if (table.headerRow) {
      const r = worksheet.getRow(row + count++);
      table.columns.forEach((column, j) => {
        const { style, name } = column;
        const cell = r.getCell(col + j);
        cell.value = name;
        assignStyle(cell, style);
      });
    }
    table.rows.forEach((data) => {
      const r = worksheet.getRow(row + count++);
      data.forEach((value, j) => {
        const cell = r.getCell(col + j);
        cell.value = value;

        assignStyle(cell, table.columns[j].style);
      });
    });

    if (table.totalsRow) {
      const r = worksheet.getRow(row + count++);
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
    const { row, col } = table.tl as { row: number; col: number };
    let count = 0;
    if (table.headerRow) {
      const r = worksheet.getRow(row + count++);
      table.columns.forEach((column, j) => {
        const cell = r.getCell(col + j);
        cell.value = column.name;
      });
    }
    table.rows.forEach((data) => {
      const r = worksheet.getRow(row + count++);
      data.forEach((value, j) => {
        const cell = r.getCell(col + j);
        cell.value = value;
      });
    });

    if (table.totalsRow) {
      const r = worksheet.getRow(row + count++);
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

  get model(): TableProperties {
    return this.table;
  }

  set model(value: TableProperties) {
    this.table = value;
  }

  // ================================================================
  // TODO: Mutating methods
  cacheState() {
    if (!this._cache) {
      this._cache = {
        ref: this.ref,
        width: this.width,
        tableHeight: this.tableHeight,
      };
    }
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
        const row = this.worksheet.getRow(ref.row + i);
        for (let j = 0; j < this._cache.width; j++) {
          const cell = row.getCell(ref.col + j);
          cell.value = null;
        }
      }
    } else {
      // clear out below table if it has shrunk
      for (let i = this.tableHeight; i < this._cache.tableHeight; i++) {
        const row = this.worksheet.getRow(ref.row + i);
        for (let j = 0; j < this._cache.width; j++) {
          const cell = row.getCell(ref.col + j);
          cell.value = null;
        }
      }

      // clear out to right of table if it has lost columns
      for (let i = 0; i < this.tableHeight; i++) {
        const row = this.worksheet.getRow(ref.row + i);
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

  _assign(target: Record<string, unknown>, prop: string, value: unknown) {
    this.cacheState();
    target[prop] = value;
  }

  /* eslint-disable lines-between-class-members */
  get ref(): string {
    return this.table.ref;
  }
  set ref(value: string) {
    this._assign(this.table as unknown as Record<string, unknown>, 'ref', value);
  }

  get name(): string {
    return this.table.name;
  }
  set name(value: string) {
    this.table.name = value;
  }

  // NB: preserves two original bugs verbatim — the getter reads the typo'd
  // `displyName` (not `displayName`), and the setter is named
  // `displayNamename` (not `displayName`), so `table.displayName = x` never
  // actually invokes it. A typing pass must not silently fix behavior.
  get displayName(): string {
    return (
      ((this.table as unknown as Record<string, unknown>).displyName as string) || this.table.name
    );
  }
  set displayNamename(value: string) {
    this.table.displayName = value;
  }

  get headerRow(): boolean | undefined {
    return this.table.headerRow;
  }
  set headerRow(value: boolean | undefined) {
    this._assign(this.table as unknown as Record<string, unknown>, 'headerRow', value);
  }

  get totalsRow(): boolean | undefined {
    return this.table.totalsRow;
  }
  set totalsRow(value: boolean | undefined) {
    this._assign(this.table as unknown as Record<string, unknown>, 'totalsRow', value);
  }

  get theme(): string | undefined {
    return (this.table.style as Record<string, unknown>).name as string | undefined;
  }
  set theme(value: string | undefined) {
    (this.table.style as Record<string, unknown>).name = value;
  }

  get showFirstColumn(): boolean | undefined {
    return (this.table.style as Record<string, unknown>).showFirstColumn as boolean | undefined;
  }
  set showFirstColumn(value: boolean | undefined) {
    (this.table.style as Record<string, unknown>).showFirstColumn = value;
  }

  get showLastColumn(): boolean | undefined {
    return (this.table.style as Record<string, unknown>).showLastColumn as boolean | undefined;
  }
  set showLastColumn(value: boolean | undefined) {
    (this.table.style as Record<string, unknown>).showLastColumn = value;
  }

  get showRowStripes(): boolean | undefined {
    return (this.table.style as Record<string, unknown>).showRowStripes as boolean | undefined;
  }
  set showRowStripes(value: boolean | undefined) {
    (this.table.style as Record<string, unknown>).showRowStripes = value;
  }

  get showColumnStripes(): boolean | undefined {
    return (this.table.style as Record<string, unknown>).showColumnStripes as boolean | undefined;
  }
  set showColumnStripes(value: boolean | undefined) {
    (this.table.style as Record<string, unknown>).showColumnStripes = value;
  }
  /* eslint-enable lines-between-class-members */
}

export default Table;
