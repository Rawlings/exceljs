import ExcelJS from '#src/index';

describe('github issues', () => {
  it('issue 257 - worksheet order is not respected', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./fixtures/xlsx/test-issue-257.xlsx').then(() => {
      expect(wb.worksheets.map((ws: any) => ws.name)).to.deep.equal(['First', 'Second']);
    });
  });
});
