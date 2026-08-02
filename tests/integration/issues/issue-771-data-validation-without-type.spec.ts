import ExcelJS from '#src/index';

describe('github issues', () => {
  it('issue 771 - Issue with dataValidation without type and with formula1 or formula2', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./fixtures/xlsx/test-issue-771.xlsx');
  });
});
