import tools from './tools';
import sheetValuesData from '#fixtures/json/sheet-values.json';
import stylesData from '#fixtures/json/styles.json';
import sheetPropertiesData from '#fixtures/json/sheet-properties.json';
import pageSetupData from '#fixtures/json/page-setup.json';
import headerFooterData from '#fixtures/json/header-footer.json';

const self: any = {
  testValues: tools.fix(sheetValuesData),
  styles: tools.fix(stylesData),
  properties: tools.fix(sheetPropertiesData),
  pageSetup: tools.fix(pageSetupData),
  headerFooter: tools.fix(headerFooterData),

  addSheet(wb: any, options: any) {
    options = options || {};
    const ws = wb.addWorksheet(options.sheetName || 'values');

    ws.properties.tabColor = self.properties.tabColor;

    ws.pageSetup = self.pageSetup;
    ws.headerFooter = self.headerFooter;

    ws.views = [
      {
        state: 'frozen',
        xSplit: 2,
        ySplit: 3,
        topLeftCell: 'C4',
        activeCell: 'D5',
      },
    ];

    ws.columns = [
      { header: 'A', key: 'col_a', width: 10 },
      { header: 'B', key: 'col_b', width: 25 },
      { header: 'C', key: 'col_c', width: 12 },
    ];

    ws.getCell('A1').value = 7;
    ws.getCell('B1').value = self.testValues.string;
    ws.getCell('C1').value = self.testValues.date;
    ws.getCell('D1').value = self.testValues.formulas[0];
    ws.getCell('E1').value = self.testValues.formulas[1];

    ws.getCell('A2').value = 5;
    ws.mergeCells('A2:B3');

    ws.mergeCells('C2:D3');

    ws.getCell('A4').value = 1.5;
    ws.getCell('B4').value = 'Hello';

    ws.getCell('A5').value = self.testValues.string;
    ws.getCell('A5').font = self.styles.fonts.arialBlackUI14;

    ws.getCell('B5').value = self.testValues.string;
    ws.getCell('B5').font = self.styles.fonts.comicSansUdB16;

    ws.getCell('C5').value = self.testValues.string;
    ws.getCell('C5').font = self.styles.fonts.broadwayRedOutline20;

    ws.getCell('D5').value = 1.6;
    ws.getCell('D5').numFmt = self.styles.numFmts.numFmt1;

    ws.getCell('E5').value = 1.6;
    ws.getCell('E5').numFmt = self.styles.numFmts.numFmt2;

    ws.getCell('F5').value = self.testValues.date;
    ws.getCell('F5').numFmt = self.styles.numFmts.dateFmt;

    ws.getCell('A6').value = 'Top Left';
    ws.getCell('A6').alignment = self.styles.alignments[0];

    ws.getCell('B6').value = 'Middle Center';
    ws.getCell('B6').alignment = self.styles.alignments[1];

    ws.getCell('C6').value = 'Bottom Right';
    ws.getCell('C6').alignment = self.styles.alignments[2];

    ws.getCell('D6').value = 'Wrāp Tēxt';
    ws.getCell('D6').alignment = self.styles.alignments[3];

    ws.getRow(6).height = 42;

    ws.getCell('A7').value = 'Thin Border';
    ws.getCell('A7').border = self.styles.borders.thin;

    ws.getCell('B7').value = 'Double Border';
    ws.getCell('B7').border = self.styles.borders.double;

    ws.getCell('C7').value = 'All Borders';
    ws.getCell('C7').border = self.styles.borders.all;

    ws.getCell('A8').value = 'Red Dark Vertical Pattern';
    ws.getCell('A8').fill = self.styles.fills.redDarkVertical;

    ws.getCell('B8').value = 'Red Green Dark Trellis Pattern';
    ws.getCell('B8').fill = self.styles.fills.redGreenDarkTrellis;

    ws.getCell('C8').value = 'Gray Pattern';
    ws.getCell('C8').fill = self.styles.fills.grayPattern;

    ws.getRow(8).height = 40;
  },

  checkSheet(wb: any, options: any) {
    options = options || {};
    const ws = wb.getWorksheet(options.sheetName || 'values');
    expect(ws).toBeDefined();

    if (options.checkSheetProperties) {
      expect(ws.properties.tabColor).to.deep.equal(self.properties.tabColor);
    }
  },
};

export default self;
