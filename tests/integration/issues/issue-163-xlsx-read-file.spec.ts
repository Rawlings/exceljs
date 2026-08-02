import ExcelJS from '../../../src/index';

describe('github issues', () => {
  it('issue 163 - Error while using xslx readFile method', () => {
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./fixtures/xlsx/test-issue-163.xlsx').then(() => {
      // arriving here is success
      expect(true).to.equal(true);
    });
  });
});
