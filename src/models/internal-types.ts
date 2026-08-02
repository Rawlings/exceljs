// Forward-declared shapes for the circular Cell <-> Row <-> Column <-> Worksheet
// <-> Workbook reference graph. These are intentionally minimal — only the
// members actually called by the *consuming* class are declared. As each real
// class gets fully typed, callers should migrate off these stand-ins onto the
// real class type; until then, these keep call sites honest without `any`.

export interface CellLike {
  value: unknown;
  style: Record<string, unknown>;
  type: unknown;
  col: number;
  row: number;
  address: string;
  [key: string]: unknown;
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
  getNamesEx(address: FullAddress): string[];
  addEx(location: FullAddress, name: string): void;
  removeEx(location: FullAddress, name: string): void;
  removeAllNames(location: FullAddress): void;
  spliceRows(sheetName: string, start: number, numDelete: number, numInsert: number): void;
  spliceColumns(sheetName: string, start: number, numDelete: number, numInsert: number): void;
}

// DataValidations is fully typed (src/models/data-validations.ts) — Cell only
// needs find/add, matching that class's real API.
export interface DataValidationLike {
  find(address: string): unknown;
  add(address: string, validation: unknown): unknown;
}

// Workbook isn't typed yet — this is the minimal surface Worksheet calls into.
export interface WorkbookLike {
  definedNames: DefinedNamesLike;
  pivotTables: unknown[];
  _worksheets: (WorksheetLike | undefined)[];
  removeWorksheetEx(worksheet: WorksheetLike): void;
}

export interface RowLike {
  number: number;
  style: Record<string, unknown>;
  dimensions: { min: number; max: number } | null;
  getCell(col: number): CellLike;
  getCellEx(address: { col: number; row: number; address: string }): CellLike;
}

export interface EachRowOptions {
  includeEmpty?: boolean;
}

export interface WorksheetLike {
  name: string;
  workbook: WorkbookLike;
  dataValidations: DataValidationLike;
  properties: { outlineLevelCol: number; outlineLevelRow: number };
  getCell(row: number, col: number): CellLike;
  getRow(number: number): RowLike;
  getColumn(number: number): ColumnLike;
  getColumnKey(key: string): ColumnLike | undefined;
  setColumnKey(key: string, column: ColumnLike): void;
  deleteColumnKey(key: string): void;
  eachRow(iteratee: (row: RowLike, rowNumber: number) => void): void;
  eachRow(
    options: EachRowOptions | null,
    iteratee: (row: RowLike, rowNumber: number) => void
  ): void;
  eachColumnKey(iteratee: (column: ColumnLike, key: string) => void): void;
}

export interface ColumnLike {
  number: number;
  width: number | undefined;
  isCustomWidth: boolean;
  style: Record<string, unknown>;
  hidden: boolean;
  outlineLevel: number;
  collapsed: boolean;
  equivalentTo(other: ColumnLike): boolean;
}
