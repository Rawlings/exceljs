import fs from 'node:fs';
import ExcelJS from '../../../src/index';

// this file to contain integration tests created from github issues
const TEST_XLSX_FILE_NAME = `./fixtures/out/wb-issue-880-${Date.now()}-${Math.random().toString(36).slice(2)}.test.xlsx`;

describe('github issues', () => {
  it('issue 880 - malformed comment crashes on write', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile('./fixtures/xlsx/test-issue-880.xlsx');
    const buffer = await wb.xlsx.writeBuffer({
      useStyles: true,
      useSharedStrings: true,
    });
    const wstream = fs.createWriteStream(TEST_XLSX_FILE_NAME);
    wstream.write(buffer);
    wstream.end();
  });
});
