import ExcelJS from '#src/index';

const TEST_567_XLSX_FILE_NAME = './fixtures/xlsx/test-pr-567.xlsx';

describe('pr related issues', () => {
  describe('pr 5676 whole column defined names', () => {
    it('Should be able to read this file', () => {
      const wb = new ExcelJS.Workbook();
      return wb.xlsx.readFile(TEST_567_XLSX_FILE_NAME);
    });
  });
});
