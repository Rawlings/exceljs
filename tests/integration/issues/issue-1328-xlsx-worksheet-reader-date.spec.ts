import ExcelJS from '#src/exceljs.nodejs';
const fs = require('fs');

describe('github issues: Date field with cache style', () => {
  const rows: any[] = [];
  beforeEach(
    () =>
      new Promise((resolve: any, reject: any) => {
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
          fs.createReadStream('./fixtures/xlsx/dateIssue.xlsx'),
          {
            worksheets: 'emit',
            styles: 'cache',
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            entries: 'ignore',
          }
        );
        workbookReader.read();
        workbookReader.on('worksheet', (worksheet: any) =>
          worksheet.on('row', (row: any) => rows.push(row.values[1]))
        );
        workbookReader.on('end', resolve);
        workbookReader.on('error', reject);
      })
  );
  it('issue 1328 - should emit row with Date Object', () => {
    expect(rows).that.deep.equals(['Date', new Date('2020-11-20T00:00:00.000Z')]);
  });
});
