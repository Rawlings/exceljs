import ExcelJS from '#src/index';

// =============================================================================
// This spec is based around a gold standard Excel workbook 'gold.xlsx'

describe('Gold Book', () => {
  describe('Read', () => {
    let wb: any;
    beforeAll(() => {
      wb = new ExcelJS.Workbook();
      return wb.xlsx.readFile('./fixtures/xlsx/gold.xlsx');
    });

    it('Values', () => {
      const ws = wb.getWorksheet('Values');

      expect(ws.getCell('B1').value).toEqual('I am Text');
      expect(ws.getCell('B2').value).toEqual(3.14);
      expect(ws.getCell('B3').value).toEqual(5);
      expect((ws.getCell('B4').value as Date).getTime()).toEqual(new Date('2016-05-17T00:00:00.000Z').getTime());
      expect(ws.getCell('B5').value).toEqual({
        formula: 'B1',
        result: 'I am Text',
      });

      expect(ws.getCell('B6').value).toEqual({
        hyperlink: 'https://www.npmjs.com/package/exceljs',
        text: 'exceljs',
      });

      expect(ws.lastColumn).toEqual(ws.getColumn(2));
      expect(ws.lastRow).toEqual(ws.getRow(6));
    });

    it('Styles', () => {});
  });
});
