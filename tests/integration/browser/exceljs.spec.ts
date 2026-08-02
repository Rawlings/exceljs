import { describe, it, expect } from 'vitest';
import ExcelJS from '../../../src/index';


describe('ExcelJS', () => {
  it('should read and write xlsx via binary buffer', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('blort');

    ws.getCell('A1').value = 'Hello, World!';
    ws.getCell('A2').value = 7;

    const buffer = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer as Buffer);
    const ws2 = wb2.getWorksheet('blort')!;
    expect(ws2).toBeTruthy();

    expect(ws2.getCell('A1').value).toEqual('Hello, World!');
    expect(ws2.getCell('A2').value).toEqual(7);
  });

  it('should read and write xlsx via base64 buffer', async () => {
    const options = {
      base64: true,
    };
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('blort');

    ws.getCell('A1').value = 'Hello, World!';
    ws.getCell('A2').value = 7;

    const buffer = (await wb.xlsx.writeBuffer(options)) as Buffer;
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buffer.toString('base64'), options);
    const ws2 = wb2.getWorksheet('blort')!;
    expect(ws2).toBeTruthy();

    expect(ws2.getCell('A1').value).toEqual('Hello, World!');
    expect(ws2.getCell('A2').value).toEqual(7);
  });

  it('should write csv via buffer', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('blort');

    ws.getCell('A1').value = 'Hello, World!';
    ws.getCell('B1').value = 'What time is it?';
    ws.getCell('A2').value = 7;
    ws.getCell('B2').value = '12pm';

    const buffer = (await wb.csv.writeBuffer()) as Buffer;
    expect(buffer.toString().replace(/\r\n/g, '\n').trim()).toEqual('"Hello, World!",What time is it?\n7,12pm');
  });
});
