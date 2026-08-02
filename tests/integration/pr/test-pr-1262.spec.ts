import ExcelJS from '#src/index';

describe('github issues', () => {
  it('pull request 1262 - protect should work with streaming workbook writer', async () => {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: './fixtures/out/wb-pr-1262.test.xlsx',
    });

    const sheet = workbook.addWorksheet('data');
    const row = sheet.addRow(['readonly cell']);
    row.getCell(1).protection = {
      locked: true,
    };

    expect(sheet.protect).to.exist;

    sheet.protect('password', {
      spinCount: 1,
    });

    await workbook.commit();

    // read in file and ensure sheetProtection is there:
    const checkBook = new ExcelJS.Workbook();
    await checkBook.xlsx.readFile('./fixtures/out/wb-pr-1262.test.xlsx');

    const checkSheet = checkBook.getWorksheet('data')!;
    expect((checkSheet.sheetProtection as any).spinCount).to.equal(1);
  });
});
