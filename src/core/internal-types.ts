/* oxlint-disable typescript/no-explicit-any */
// Forward-declared shapes for the circular Cell <-> Row <-> Column <-> Worksheet
// <-> Workbook reference graph. These are intentionally minimal — only the
// members actually called by the *consuming* class are declared. As each real
// class gets fully typed, callers should migrate off these stand-ins onto the
// real class type; until then, these keep call sites honest without `any`.

export interface CellLike {
  value?: unknown;
  style: Record<string, unknown>;
  type?: unknown;
  col: number;
  row: number;
  address: string;
  model?: any;
  merge?(master: unknown): void;
  unmerge?(): void;
  master?: any;
  _value?: any;
  _row?: any;
  _column?: any;
  [key: string]: any;
}

export interface FullAddress {
  sheetName: string;
  address: string;
  row: number;
  col: number;
}

// DefinedNames isn't typed yet — this is the minimal surface Cell/Worksheet
// call into.
export interface DefinedNamesLike {
  model?: unknown;
  getNamesEx?(address: FullAddress): string[];
  addEx?(location: FullAddress, name: string): void;
  removeEx?(location: FullAddress, name: string): void;
  removeAllNames?(location: FullAddress): void;
  spliceRows?(sheetName: string, start: number, numDelete: number, numInsert: number): void;
  spliceColumns?(sheetName: string, start: number, numDelete: number, numInsert: number): void;
  [key: string]: any;
}

// DataValidations is fully typed (src/models/data-validations.ts) — Cell only
// needs find/add, matching that class's real API.
export interface DataValidationLike {
  find(address: string): unknown;
  add(address: string, validation: unknown): unknown;
  [key: string]: any;
}

// Workbook isn't typed yet — this is the minimal surface Worksheet calls into.
export interface WorkbookLike {
  definedNames?: DefinedNamesLike;
  pivotTables?: any[];
  _worksheets?: any[];
  removeWorksheetEx?(worksheet: WorksheetLike): void;
  [key: string]: any;
}

export interface RowLike {
  number: number;
  style?: Record<string, unknown>;
  dimensions?: { min: number; max: number } | null;
  getCell?(col: number): any;
  getCellEx?(address: { col: number; row: number; address: string }): any;
  findCell?(col: number): any;
  values?: any;
  height?: number;
  eachCell?(
    options: { includeEmpty?: boolean },
    callback: (cell: any, colNumber: number) => void
  ): void;
  [key: string]: any;
}

export interface EachRowOptions {
  includeEmpty?: boolean;
}

export interface WorksheetLike {
  id?: number | string;
  name?: string;
  workbook?: WorkbookLike;
  dataValidations?: DataValidationLike;
  properties?: Record<string, any>;
  getCell?: (row: number | string, col?: number) => any;
  getRow?: (number: number) => any;
  getColumn?: (number: number | string) => any;
  getColumnKey?: (key: string) => any;
  setColumnKey?: (key: string, column: any) => void;
  deleteColumnKey?: (key: string) => void;
  eachRow?: (options?: any, iteratee?: any) => void;
  eachColumnKey?: (iteratee: (column: any, key: string) => void) => void;
  _commitRow?: (row: any) => void;
  [key: string]: any;
}

export interface ColumnLike {
  number: number;
  letter?: string;
  width?: number | undefined;
  isCustomWidth?: boolean;
  style?: Record<string, unknown>;
  hidden?: boolean;
  outlineLevel?: number;
  collapsed?: boolean;
  equivalentTo?(other: ColumnLike): boolean;
  defn?: any;
  [key: string]: any;
}
