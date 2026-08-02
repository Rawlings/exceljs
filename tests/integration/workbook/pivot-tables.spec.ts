import { readFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';

import ExcelJS from '../../../src/index';

const PIVOT_TABLE_FILEPATHS = [
  'xl/pivotCache/pivotCacheRecords1.xml',
  'xl/pivotCache/pivotCacheDefinition1.xml',
  'xl/pivotCache/_rels/pivotCacheDefinition1.xml.rels',
  'xl/pivotTables/pivotTable1.xml',
  'xl/pivotTables/_rels/pivotTable1.xml.rels',
];

const TEST_XLSX_FILEPATH = './fixtures/out/wb.test.xlsx';

const TEST_DATA = [
  ['A', 'B', 'C', 'D', 'E'],
  ['a1', 'b1', 'c1', 4, 5],
  ['a1', 'b2', 'c1', 4, 5],
  ['a2', 'b1', 'c2', 14, 24],
  ['a2', 'b2', 'c2', 24, 35],
  ['a3', 'b1', 'c3', 34, 45],
  ['a3', 'b2', 'c3', 44, 45],
];

// =============================================================================
// Tests

describe('Workbook', () => {
  describe('Pivot Tables', () => {
    it('if pivot table added, then certain xml and rels files are added', async () => {
      const workbook = new ExcelJS.Workbook();

      const worksheet1 = workbook.addWorksheet('Sheet1');
      worksheet1.addRows(TEST_DATA);

      const worksheet2 = workbook.addWorksheet('Sheet2');
      worksheet2.addPivotTable({
        sourceSheet: worksheet1,
        rows: ['A', 'B'],
        columns: ['C'],
        values: ['E'],
        metric: 'sum',
      });

      await workbook.xlsx.writeFile(TEST_XLSX_FILEPATH);
      const buffer = await readFile(TEST_XLSX_FILEPATH);
      const unzipped = unzipSync(new Uint8Array(buffer));
      for (const filepath of PIVOT_TABLE_FILEPATHS) {
        expect(unzipped[filepath]).toBeDefined();
      }
    });

    it('if pivot table NOT added, then certain xml and rels files are not added', async () => {
      const workbook = new ExcelJS.Workbook();

      const worksheet1 = workbook.addWorksheet('Sheet1');
      worksheet1.addRows(TEST_DATA);

      workbook.addWorksheet('Sheet2');

      await workbook.xlsx.writeFile(TEST_XLSX_FILEPATH);
      const buffer = await readFile(TEST_XLSX_FILEPATH);
      const unzipped = unzipSync(new Uint8Array(buffer));
      for (const filepath of PIVOT_TABLE_FILEPATHS) {
        expect(unzipped[filepath]).toBeUndefined();
      }
    });
  });
});
