import tools from './tools';

import _ from './under-dash';
import Row from '../../src/core/row';
import Column from '../../src/core/column';
import testWorkbookReader from './test-workbook-reader';

import dataValidationsSheet from './test-data-validation-sheet';
import conditionalFormattingSheet from './test-conditional-formatting-sheet';
import valuesSheet from './test-values-sheet';
import spliceSheet from './test-spliced-sheet';

import viewsData from '#fixtures/json/views.json';
import sheetValuesData from '#fixtures/json/sheet-values.json';
import stylesData from '#fixtures/json/styles.json';
import sheetPropertiesData from '#fixtures/json/sheet-properties.json';
import pageSetupData from '#fixtures/json/page-setup.json';
import conditionalFormattingData from '#fixtures/json/conditional-formatting.json';
import headerFooterData from '#fixtures/json/header-footer.json';

const testSheets = {
  dataValidations: dataValidationsSheet,
  conditionalFormatting: conditionalFormattingSheet,
  values: valuesSheet,
  splice: spliceSheet,
};

function getOptions(docType: string, options?: any) {
  let result: any;
  switch (docType) {
    case 'xlsx':
      result = {
        sheetName: 'values',
        checkFormulas: true,
        checkMerges: true,
        checkStyles: true,
        checkBadAlignments: true,
        checkSheetProperties: true,
        dateAccuracy: 3,
        checkViews: true,
      };
      break;
    case 'csv':
      result = {
        sheetName: 'sheet1',
        checkFormulas: false,
        checkMerges: false,
        checkStyles: false,
        checkBadAlignments: false,
        checkSheetProperties: false,
        dateAccuracy: 1000,
        checkViews: false,
      };
      break;
    default:
      throw new Error(`Bad doc-type: ${docType}`);
  }
  return Object.assign(result, options);
}

const utilsModule: any = {
  views: tools.fix(viewsData),
  testValues: tools.fix(sheetValuesData),
  styles: tools.fix(stylesData),
  properties: tools.fix(sheetPropertiesData),
  pageSetup: tools.fix(pageSetupData),
  conditionalFormatting: tools.fix(conditionalFormattingData),
  headerFooter: tools.fix(headerFooterData),

  createTestBook(workbook: any, docType: string, sheets?: string[]) {
    const options = getOptions(docType);
    sheets = sheets || ['values'];

    workbook.views = [{ x: 1, y: 2, width: 10000, height: 20000, firstSheet: 0, activeTab: 0 }];

    sheets.forEach((sheet: any) => {
      const testSheet = _.get(testSheets, sheet);
      testSheet.addSheet(workbook, options);
    });

    return workbook;
  },

  checkTestBook(workbook: any, docType: string, sheets?: string[], options?: any) {
    options = getOptions(docType, options);
    sheets = sheets || ['values'];

    expect(workbook).toBeDefined();

    if (options.checkViews) {
      expect(workbook.views).to.deep.equal([
        {
          x: 1,
          y: 2,
          width: 10000,
          height: 20000,
          firstSheet: 0,
          activeTab: 0,
          visibility: 'visible',
        },
      ]);
    }

    sheets.forEach((sheet: any) => {
      const testSheet = _.get(testSheets, sheet);
      testSheet.checkSheet(workbook, options);
    });
  },

  checkTestBookReader: testWorkbookReader.checkBook,

  createSheetMock() {
    return {
      _keys: {} as Record<string, any>,
      _cells: {} as Record<string, any>,
      rows: [] as any[],
      columns: [] as any[],
      properties: {
        outlineLevelCol: 0,
        outlineLevelRow: 0,
      },

      addColumn(colNumber: number, defn: any) {
        const newColumn = new Column(this as any, colNumber, defn);
        this.columns[colNumber - 1] = newColumn;
        return newColumn;
      },
      getColumn(colNumber: number) {
        let column = this.columns[colNumber - 1] || this._keys[colNumber];
        if (!column) {
          column = this.columns[colNumber - 1] = new Column(this as any, colNumber);
        }
        return column;
      },
      getRow(rowNumber: number) {
        let row = this.rows[rowNumber - 1];
        if (!row) {
          row = this.rows[rowNumber - 1] = new Row(this as any, rowNumber);
        }
        return row;
      },
      getCell(rowNumber: number, colNumber: number) {
        return this.getRow(rowNumber).getCell(colNumber);
      },
      getColumnKey(key: string) {
        return this._keys[key];
      },
      setColumnKey(key: string, value: any) {
        this._keys[key] = value;
      },
      deleteColumnKey(key: string) {
        delete this._keys[key];
      },
      eachColumnKey(f: any) {
        _.each(this._keys, f);
      },
      eachRow(opt: any, f?: any) {
        if (!f) {
          f = opt;
          opt = {};
        }
        if (opt && opt.includeEmpty) {
          const n = this.rows.length;
          for (let i = 1; i <= n; i++) {
            f(this.getRow(i), i);
          }
        } else {
          this.rows.forEach((r: any, i: any) => {
            if (r) {
              f(r, i + 1);
            }
          });
        }
      },
    };
  },
};

export const createSheetMock = utilsModule.createSheetMock;
export const createTestBook = utilsModule.createTestBook;
export const checkTestBook = utilsModule.checkTestBook;

export default utilsModule;
