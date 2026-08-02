import path from 'node:path';
import ExcelJS from '#src/exceljs.nodejs';

const TEST_XLSX_FILE_NAME = path.resolve(__dirname, '../data/test-issue-1364.xlsx');

describe('github issues', () => {
  it('issue 1364 - Incorrect Worksheet Name on Streaming XLSX Reader', async () => {
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(TEST_XLSX_FILE_NAME, {});
    workbookReader.read();
    workbookReader.on('worksheet', (worksheet: any) => {
      expect(worksheet.name).to.equal('Sum Worksheet');
    });
  });
});
