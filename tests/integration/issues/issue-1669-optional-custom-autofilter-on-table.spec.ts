import ExcelJS from '#src/index';

describe('github issues', () => {
  it('issue 1669 - optional autofilter and custom autofilter on tables', function (this: any) {
    this?.timeout?.(6000);
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./fixtures/xlsx/test-issue-1669.xlsx');
  });
});
