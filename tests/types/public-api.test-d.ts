import { describe, test, expectTypeOf } from 'vitest';
import type {
  WorkbookWriter,
  WorkbookReader} from '../../src/index';
import ExcelJS, {
  Workbook,
  Worksheet,
  Row,
  Column,
  Cell,
  Range,
  Table,
  ValueType,
  FormulaType,
  RelationshipType,
  DocumentType,
  ReadingOrder,
  type Style,
  type Font,
  type Fill,
  type Border,
  type Alignment,
  type CellValue,
  type DataValidation,
  type PageSetup,
  type HeaderFooter,
  type AutoFilter,
  type WorksheetProtection,
  type XlsxReadOptions,
  type CsvWriteOptions,
} from '../../src/index';

describe('Public API Type Definitions', () => {
  test('Workbook API', () => {
    expectTypeOf(Workbook).toEqualTypeOf<typeof Workbook>();
    expectTypeOf(ExcelJS.Workbook).toEqualTypeOf<typeof Workbook>();

    const wb = new Workbook();
    expectTypeOf(wb).toEqualTypeOf<Workbook>();
    expectTypeOf(wb.addWorksheet).toBeFunction();
    expectTypeOf(wb.getWorksheet).toBeFunction();
    expectTypeOf(wb.removeWorksheet).toBeFunction();
  });

  test('Worksheet API', () => {
    expectTypeOf(Worksheet).toEqualTypeOf<typeof Worksheet>();

    const wb = new Workbook();
    const ws = wb.addWorksheet('Sheet1');
    expectTypeOf(ws).toEqualTypeOf<Worksheet>();
    expectTypeOf(ws.addRow).toBeFunction();
    expectTypeOf(ws.getRow).toBeFunction();
    expectTypeOf(ws.getColumn).toBeFunction();
    expectTypeOf(ws.getCell).toBeFunction();
    expectTypeOf(ws.mergeCells).toBeFunction();
  });

  test('Row API', () => {
    expectTypeOf(Row).toEqualTypeOf<typeof Row>();

    const wb = new Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const row = ws.getRow(1);
    expectTypeOf(row).toEqualTypeOf<Row>();
    expectTypeOf(row.getCell).toBeFunction();
    expectTypeOf(row.eachCell).toBeFunction();
  });

  test('Column API', () => {
    expectTypeOf(Column).toEqualTypeOf<typeof Column>();

    const wb = new Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const col = ws.getColumn(1);
    expectTypeOf(col).toEqualTypeOf<Column>();
    expectTypeOf(col.eachCell).toBeFunction();
  });

  test('Cell API', () => {
    expectTypeOf(Cell).toEqualTypeOf<typeof Cell>();

    const wb = new Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const cell = ws.getCell('A1');
    expectTypeOf(cell.value).not.toBeUndefined();
  });

  test('Range and Table API', () => {
    expectTypeOf(Range).toEqualTypeOf<typeof Range>();
    expectTypeOf(Table).toEqualTypeOf<typeof Table>();
  });

  test('Enum Exports', () => {
    expectTypeOf(ValueType.Number).toBeNumber();
    expectTypeOf(FormulaType.Master).toBeNumber();
    expectTypeOf(RelationshipType.Worksheet).toBeNumber();
    expectTypeOf(DocumentType.Xlsx).toBeNumber();
    expectTypeOf(ReadingOrder.LeftToRight).toBeNumber();
  });

  test('ExcelJS default export namespace', () => {
    expectTypeOf(ExcelJS.Workbook).toEqualTypeOf<typeof Workbook>();
    expectTypeOf(ExcelJS.Worksheet).toEqualTypeOf<typeof Worksheet>();
    expectTypeOf(ExcelJS.Row).toEqualTypeOf<typeof Row>();
    expectTypeOf(ExcelJS.Column).toEqualTypeOf<typeof Column>();
    expectTypeOf(ExcelJS.Cell).toEqualTypeOf<typeof Cell>();
    expectTypeOf(ExcelJS.stream.xlsx.WorkbookWriter).toEqualTypeOf<typeof WorkbookWriter>();
    expectTypeOf(ExcelJS.stream.xlsx.WorkbookReader).toEqualTypeOf<typeof WorkbookReader>();
  });

  test('Public Type Interfaces', () => {
    expectTypeOf<Style>().not.toBeAny();
    expectTypeOf<Font>().not.toBeAny();
    expectTypeOf<Fill>().not.toBeAny();
    expectTypeOf<Border>().not.toBeAny();
    expectTypeOf<Alignment>().not.toBeAny();
    expectTypeOf<CellValue>().not.toBeAny();
    expectTypeOf<DataValidation>().not.toBeAny();
    expectTypeOf<PageSetup>().not.toBeAny();
    expectTypeOf<HeaderFooter>().not.toBeAny();
    expectTypeOf<AutoFilter>().not.toBeAny();
    expectTypeOf<WorksheetProtection>().not.toBeAny();
    expectTypeOf<XlsxReadOptions>().not.toBeAny();
    expectTypeOf<CsvWriteOptions>().not.toBeAny();
  });
});
