import tools from './tools';
import sheetValuesData from './data/sheet-values.json';
import stylesData from './data/styles.json';
import sheetPropertiesData from './data/sheet-properties.json';
import pageSetupData from './data/page-setup.json';
import utils from '../../src/utils/utils';
import ExcelJS from '../../src/exceljs.nodejs';

function fillFormula(f: any) {
  return Object.assign({ formula: undefined }, f);
}

const testValues: any = tools.fix(sheetValuesData);

const streamedValues: any = {
  B1: { sharedString: 0 },
  C1: utils.dateToExcel(testValues.date),
  D1: fillFormula(testValues.formulas[0]),
  E1: fillFormula(testValues.formulas[1]),
  F1: { sharedString: 1 },
  G1: { sharedString: 2 },
};

const self: any = {
  testValues,
  styles: tools.fix(stylesData),
  properties: tools.fix(sheetPropertiesData),
  pageSetup: tools.fix(pageSetupData),

  checkBook(filename: string) {
    const wb = new ExcelJS.stream.xlsx.WorkbookReader();
    const dateAccuracy = 0.00001;

    return new Promise<void>((resolve, reject) => {
      let rowCount = 0;

      wb.on('worksheet', (ws) => {
        ws.on('row', (row) => {
          rowCount++;
          try {
            switch (row.number) {
              case 1:
                expect(row.getCell('A').value).to.equal(7);
                expect(row.getCell('A').type).to.equal(ExcelJS.ValueType.Number);
                expect(row.getCell('B').value).to.deep.equal(streamedValues.B1);
                expect(row.getCell('B').type).to.equal(ExcelJS.ValueType.String);
                expect(Math.abs(row.getCell('C').value - streamedValues.C1)).to.be.below(
                  dateAccuracy
                );
                expect(row.getCell('C').type).to.equal(ExcelJS.ValueType.Number);
                break;
              default:
                break;
            }
          } catch (error) {
            reject(error);
          }
        });
      });
      wb.on('end', () => {
        try {
          expect(rowCount).to.equal(11);
          resolve(undefined as any);
        } catch (error) {
          reject(error);
        }
      });

      wb.read(filename, { entries: 'emit', worksheets: 'emit' });
    });
  },
};

export default self;
