const fs = require('fs');

import ExcelJS from '../../../src/index';

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = './fixtures/out/wb-issue-880.test.xlsx';

describe('github issues', () => {
  it('issue 880 - malformed comment crashes on write', function (this: any) {
    this?.timeout?.(6000);
    const wb = new ExcelJS.Workbook();
    return wb.xlsx.readFile('./fixtures/xlsx/test-issue-880.xlsx').then(() => {
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
    });
  });
});
