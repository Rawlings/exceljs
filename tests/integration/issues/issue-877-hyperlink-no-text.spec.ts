const fs = require('fs');

import ExcelJS from '#src/exceljs.nodejs';

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = './fixtures/out/wb-issue-877.test.xlsx';

describe('github issues', () => {
  it('issue 877 - hyperlink without text crashes on write', () => {
    const wb = new ExcelJS.Workbook();
    return (
      wb.xlsx
        // .readFile('./fixtures/xlsx/test-issue-877.xlsx')
        .readFile('./fixtures/xlsx/test-issue-877.xlsx')
        .then(() => {
          wb.xlsx
            .writeBuffer({
              useStyles: true,
              useSharedStrings: true,
            })
            .then(function (buffer: any) {
              const wstream = fs.createWriteStream(TEST_XLSX_FILE_NAME);
              wstream.write(buffer);
              wstream.end();
            });
        })
    );
  });
});
