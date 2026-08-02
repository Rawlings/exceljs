import Workbook from './core/workbook';
import Worksheet from './core/worksheet';
import Row from './core/row';
import Column from './core/column';
import Cell from './core/cell';
import Range from './core/range';
import Table from './core/table';
import ModelContainer from './core/modelcontainer';
import WorkbookWriter from './streaming/workbook-writer';
import WorkbookReader from './streaming/workbook-reader';
import * as Enums from './core/enums';

export {
  Workbook,
  Worksheet,
  Row,
  Column,
  Cell,
  Range,
  Table,
  ModelContainer,
  WorkbookWriter,
  WorkbookReader,
};

export * from './core/enums';
export type * from './core/cell';
export type * from './core/row';
export type * from './core/column';
export type * from './core/worksheet';
export type * from './core/workbook';
export type * from './core/data-validations';
export type * from './core/range';
export type * from './core/table';
export type * from './core/anchor';
export type * from './core/defined-names';
export type * from './utils/data/cell-matrix';
export type * from './core/image';
export type * from './core/conditional-formatting';
export type * from './formats/xlsx/xlsx';
export type * from './formats/csv/csv';
export type * from './streaming/workbook-writer';
export type * from './streaming/workbook-reader';
export type * from './streaming/worksheet-reader';

export namespace config {
  export function setValue(_key: string, _value: unknown): void { }
}

export namespace stream {
  export namespace xlsx {
    export type WorkbookWriterOptions = import('./streaming/workbook-writer').WorkbookWriterOptions;
    export type WorkbookWriter = import('./streaming/workbook-writer').WorkbookWriter;
    export type WorkbookReader = import('./streaming/workbook-reader').WorkbookReader;
    export type WorksheetReader = import('./streaming/worksheet-reader').WorksheetReader;
  }
}

const ExcelJS = {
  Workbook,
  Worksheet,
  Row,
  Column,
  Cell,
  Range,
  Table,
  ModelContainer,
  stream: {
    xlsx: {
      WorkbookWriter,
      WorkbookReader,
    },
  },
  ...Enums,
};

export default ExcelJS;
