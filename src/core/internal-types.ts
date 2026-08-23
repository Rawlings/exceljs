// Forward-declared shapes for the circular Cell <-> Row <-> Column <-> Worksheet
// <-> Workbook reference graph. These are intentionally minimal — only the
// members actually called by the *consuming* class are declared.

export interface CellLike {
  value?: any;
  style: any;
  type?: any;
  col: number;
  row: number;
  address: string;
  formula?: string;
  model?: any;
  merge?(master: any, ignoreStyle?: boolean): void;
  unmerge?(): void;
  master?: CellLike;
  text?: string;
  hyperlink?: string;
  numFmt?: any;
  font?: any;
  alignment?: any;
  protection?: any;
  border?: any;
  fill?: any;
  name?: any;
  names?: any;
  note?: any;
  comment?: any;
  _value?: any;
  _row?: RowLike;
  _column?: ColumnLike;
}

export interface FullAddress {
  sheetName: string;
  address: string;
  row: number;
  col: number;
}

// DefinedNames surface Cell/Worksheet call into.
export interface DefinedNamesLike {
  model?: any;
  getNamesEx(address: FullAddress): string[];
  addEx(location: FullAddress, name: string): void;
  removeEx(location: FullAddress, name: string): void;
  removeAllNames(location: FullAddress): void;
  spliceRows?(sheetName: string, start: number, numDelete: number, numInsert: number): void;
  spliceColumns?(sheetName: string, start: number, numDelete: number, numInsert: number): void;
}

import type { DataValidation } from './data-validations';

// DataValidations surface Cell calls into.
export interface DataValidationLike {
  find(address: string): DataValidation | undefined;
  add(address: string, validation: any): any;
  remove?(address: string): any;
}

// Workbook surface Worksheet calls into.
export interface WorkbookLike {
  definedNames?: any;
  pivotTables?: any[];
  _worksheets?: any[];
  removeWorksheetEx?(worksheet: any): void;
  [key: string]: any;
}

export interface RowLike {
  number: number;
  style?: any;
  dimensions?: { min: number; max: number } | null;
  getCell?(col: number): any;
  getCellEx?(address: any): any;
  findCell?(col: number): any;
  values?: any;
  height?: number;
  _worksheet?: any;
  worksheet?: any;
  eachCell?(options: any, callback?: any): void;
}

export interface EachRowOptions {
  includeEmpty?: boolean;
}

export interface WorksheetLike {
  id?: number | string;
  name?: string;
  workbook?: any;
  dataValidations?: any;
  properties?: any;
  getCell?: (row: any, col?: number) => any;
  findCell?: (rowOrAddress: any, col?: number) => any;
  getRow?: (number: number) => any;
  getColumn?: (number: number | string) => any;
  getColumnKey?: (key: string) => any;
  setColumnKey?: (key: string, column: any) => void;
  deleteColumnKey?: (key: string) => void;
  eachRow?: (...args: any[]) => void;
  eachColumnKey?: (iteratee: (column: any, key: string) => void) => void;
  _commitRow?: (row: any) => void;
  rowBreaks?: any[];
  [key: string]: any;
}

export interface ColumnLike {
  number: number;
  letter?: string;
  width?: number | undefined;
  isCustomWidth?: boolean;
  style?: any;
  hidden?: boolean;
  outlineLevel?: number;
  collapsed?: boolean;
  equivalentTo?(other: any): boolean;
  defn?: any;
  values?: any;
}
