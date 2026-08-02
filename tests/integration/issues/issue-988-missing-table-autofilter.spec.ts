import ExcelJS from '#src/exceljs.nodejs';

describe('github issues', () => {
  it('issue 988 - table without autofilter model', function (this: any) {
    this?.timeout?.(6000);
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./fixtures/xlsx/test-issue-988.xlsx');
  });
});
