import fs from 'node:fs';
import testutils from '../utils/index';

import ExcelJS from '#src/index';


const TEST_FILE_NAME = './fixtures/out/wb.test.xlsx';

// need some architectural changes to make stream read work properly
// because of: shared strings, sheet names, etc are not read in guaranteed order
describe('WorkbookReader', () => {
  describe('Serialise', () => {
    it('xlsx file', function (this: any) {
      this?.timeout?.(10000);
      const wb = testutils.createTestBook(new ExcelJS.Workbook(), 'xlsx');

      return wb.xlsx
        .writeFile(TEST_FILE_NAME)
        .then(() => testutils.checkTestBookReader(TEST_FILE_NAME));
    });
  });

  describe('#readFile', () => {
    describe('Row limit', () => {
      it('should bail out if the file contains more rows than the limit', () => {
        const workbook = new ExcelJS.Workbook();
        // The Fibonacci sheet has 19 rows
        return workbook.xlsx
          .readFile('./fixtures/xlsx/fibonacci.xlsx', { maxRows: 10 })
          .then(
            () => {
              throw new Error('Promise unexpectedly fulfilled');
            },
            (err: any) => {
              expect(err.message).to.equal('Max row count (10) exceeded');
            }
          );
      });

      it('should fail fast on a huge file', function (this: any) {
      this?.timeout?.(5000);
        const workbook = new ExcelJS.Workbook();
        return workbook.xlsx.readFile('./fixtures/xlsx/huge.xlsx', { maxRows: 100 }).then(
          () => {
            throw new Error('Promise unexpectedly fulfilled');
          },
          (err: any) => {
            expect(err.message).to.equal('Max row count (100) exceeded');
          }
        );
      });

      it('should parse fine if the limit is not exceeded', () => {
        const workbook = new ExcelJS.Workbook();
        return workbook.xlsx.readFile('./fixtures/xlsx/fibonacci.xlsx', { maxRows: 20 });
      });
    });

    describe('Column limit', () => {
      it('should bail out if the file contains more cells than the limit', () => {
        const workbook = new ExcelJS.Workbook();
        // The many-columns sheet has 20 columns in row 2
        return workbook.xlsx
          .readFile('./fixtures/xlsx/many-columns.xlsx', {
            maxCols: 15,
          })
          .then(
            () => {
              throw new Error('Promise unexpectedly fulfilled');
            },
            (err: any) => {
              expect(err.message).to.equal('Max column count (15) exceeded');
            }
          );
      });

      it('should fail fast on a huge file', function (this: any) {
      this?.timeout?.(5000);
        const workbook = new ExcelJS.Workbook();
        return workbook.xlsx.readFile('./fixtures/xlsx/huge.xlsx', { maxCols: 10 }).then(
          () => {
            throw new Error('Promise unexpectedly fulfilled');
          },
          (err: any) => {
            expect(err.message).to.equal('Max column count (10) exceeded');
          }
        );
      });

      it('should parse fine if the limit is not exceeded', () => {
        const workbook = new ExcelJS.Workbook();
        return workbook.xlsx.readFile('./fixtures/xlsx/many-columns.xlsx', { maxCols: 40 });
      });
    });
  });

  describe('#read', () => {
    describe('Row limit', () => {
      it('should bail out if the file contains more rows than the limit', () => {
        const workbook = new ExcelJS.Workbook();
        // The Fibonacci sheet has 19 rows
        return workbook.xlsx
          .read(fs.createReadStream('./fixtures/xlsx/fibonacci.xlsx'), {
            maxRows: 10,
          })
          .then(
            () => {
              throw new Error('Promise unexpectedly fulfilled');
            },
            (err: any) => {
              expect(err.message).to.equal('Max row count (10) exceeded');
            }
          );
      });

      it('should parse fine if the limit is not exceeded', () => {
        const workbook = new ExcelJS.Workbook();
        return workbook.xlsx.read(fs.createReadStream('./fixtures/xlsx/fibonacci.xlsx'), {
          maxRows: 20,
        });
      });
    });
  });

  describe('edit styles in existing file', () => {
    beforeEach(function (this: any) {
      this.wb = new ExcelJS.Workbook();
      return this.wb.xlsx.readFile('./fixtures/xlsx/test-row-styles.xlsx');
    });

    it('edit styles of single row instead of all', function (this: any) {
      const ws = this.wb.getWorksheet(1);

      ws.eachRow((row: any, rowNo: any) => {
        if (rowNo % 5 === 0) {
          row.font = { color: { argb: '00ff00' } };
        }
      });

      expect(ws.getRow(3).font.color.argb).to.be.equal(ws.getRow(6).font.color.argb);
      expect(ws.getRow(6).font.color.argb).to.be.equal(ws.getRow(9).font.color.argb);
      expect(ws.getRow(9).font.color.argb).to.be.equal(ws.getRow(12).font.color.argb);
      expect(ws.getRow(12).font.color.argb).not.to.be.equal(ws.getRow(15).font.color.argb);
      expect(ws.getRow(15).font.color.argb).not.to.be.equal(ws.getRow(18).font.color.argb);
      expect(ws.getRow(15).font.color.argb).to.be.equal(ws.getRow(10).font.color.argb);
      expect(ws.getRow(10).font.color.argb).to.be.equal(ws.getRow(5).font.color.argb);
    });
  });

  describe('with a spreadsheet that contains formulas', () => {
    let worksheet: any;
    beforeAll(async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.read(fs.createReadStream('./fixtures/xlsx/formulas.xlsx'));
      worksheet = workbook.getWorksheet();
    });

    describe('with a cell that contains a regular formula', () => {
      let cell: any;
      beforeEach(() => {
        cell = worksheet.getCell('A2');
      });

      it('should be classified as a formula cell', () => {
        expect(cell.type).to.equal(ExcelJS.ValueType.Formula);
      });

      it('should have text corresponding to the evaluated formula result', () => {
        expect(cell.text).to.equal('someone@example.com');
      });

      it('should have the formula source', () => {
        expect(cell.model.formula).to.equal('_xlfn.CONCAT("someone","@example.com")');
      });
    });

    describe('with a cell that contains a hyperlinked formula', () => {
      let cell: any;
      beforeEach(() => {
        cell = worksheet.getCell('A1');
      });

      it('should be classified as a formula cell', () => {
        expect(cell.type).to.equal(ExcelJS.ValueType.Hyperlink);
      });

      it('should have text corresponding to the evaluated formula result', () => {
        expect(cell.value.text).to.equal('someone@example.com');
      });

      it('should have the formula source', () => {
        expect(cell.model.formula).to.equal('_xlfn.CONCAT("someone","@example.com")');
      });

      it('should contain the linked url', () => {
        expect(cell.value.hyperlink).to.equal('mailto:someone@example.com');
        expect(cell.hyperlink).to.equal('mailto:someone@example.com');
      });
    });
  });

  describe('with a spreadsheet that contains a shared string with an escaped underscore', () => {
    let worksheet: any;
    beforeAll(async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.read(
        fs.createReadStream('./fixtures/xlsx/shared_string_with_escape.xlsx')
      );
      worksheet = workbook.getWorksheet();
    });

    it('should decode the underscore', () => {
      const cell = worksheet.getCell('A1');
      expect(cell.value).to.equal('_x000D_');
    });
  });

  describe('with a spreadsheet that has an XML parse error in a worksheet', () => {
    let unhandledRejection: any;
    function unhandledRejectionHandler(err: any) {
      unhandledRejection = err;
    }
    beforeEach(() => {
      process.on('unhandledRejection', unhandledRejectionHandler);
    });
    afterEach(() => {
      process.removeListener('unhandledRejection', unhandledRejectionHandler);
    });

    it('should reject the promise with the sax error', () => {
      const workbook = new ExcelJS.Workbook();
      return workbook.xlsx
        .readFile('./fixtures/xlsx/invalid-xml.xlsx')
        .then(
          () => {
            throw new Error('Promise unexpectedly fulfilled');
          },
          (err: any) => {
            expect(err.message).to.equal('3:1: text data outside of root node.');
            // Wait a tick before checking for an unhandled rejection
            return new Promise(setImmediate);
          }
        )
        .then(() => {
          expect(unhandledRejection).to.be.undefined;
        });
    });
  });

  describe('with a spreadsheet that is missing some files in the zip container', () => {
    it('should not break', () => {
      const workbook = new ExcelJS.Workbook();
      return workbook.xlsx.readFile('./fixtures/xlsx/missing-bits.xlsx');
    });
  });

  describe('with a spreadsheet that contains images', () => {
    let worksheet: any;
    beforeAll(async () => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.read(fs.createReadStream('./fixtures/xlsx/images.xlsx'));
      worksheet = workbook.getWorksheet();
      this.worksheet = worksheet;
    });

    describe('with image`s tl anchor', () => {
      it('Should integer part of col equals nativeCol', function (this: any) {
        this.worksheet.getImages().forEach((image: any) => {
          expect(Math.floor(image.range.tl.col)).to.equal(image.range.tl.nativeCol);
        });
      });
      it('Should integer part of row equals nativeRow', function (this: any) {
        this.worksheet.getImages().forEach((image: any) => {
          expect(Math.floor(image.range.tl.row)).to.equal(image.range.tl.nativeRow);
        });
      });
      it('Should anchor width equals to column width when custom', function (this: any) {
        const ws = this.worksheet;

        ws.getImages().forEach((image: any) => {
          const col = ws.getColumn(image.range.tl.nativeCol + 1);

          if (col.isCustomWidth) {
            expect(image.range.tl.colWidth).to.equal(Math.floor(col.width * 10000));
          } else {
            expect(image.range.tl.colWidth).to.equal(640000);
          }
        });
      });
      it('Should anchor height equals to row height', function (this: any) {
        const ws = this.worksheet;

        ws.getImages().forEach((image: any) => {
          const row = ws.getRow(image.range.tl.nativeRow + 1);

          if (row.height) {
            expect(image.range.tl.rowHeight).to.equal(Math.floor(row.height * 10000));
          } else {
            expect(image.range.tl.rowHeight).to.equal(180000);
          }
        });
      });
    });

    describe('with image`s br anchor', () => {
      it('Should integer part of col equals nativeCol', function (this: any) {
        this.worksheet.getImages().forEach((image: any) => {
          expect(Math.floor(image.range.br.col)).to.equal(image.range.br.nativeCol);
        });
      });
      it('Should integer part of row equals nativeRow', function (this: any) {
        this.worksheet.getImages().forEach((image: any) => {
          expect(Math.floor(image.range.br.row)).to.equal(image.range.br.nativeRow);
        });
      });
      it('Should anchor width equals to column width when custom', function (this: any) {
        const ws = this.worksheet;

        ws.getImages().forEach((image: any) => {
          const col = ws.getColumn(image.range.br.nativeCol + 1);

          if (col.isCustomWidth) {
            expect(image.range.br.colWidth).to.equal(Math.floor(col.width * 10000));
          } else {
            expect(image.range.br.colWidth).to.equal(640000);
          }
        });
      });
      it('Should anchor height equals to row height', function (this: any) {
        const ws = this.worksheet;

        ws.getImages().forEach((image: any) => {
          const row = ws.getRow(image.range.br.nativeRow + 1);

          if (row.height) {
            expect(image.range.br.rowHeight).to.equal(Math.floor(row.height * 10000));
          } else {
            expect(image.range.br.rowHeight).to.equal(180000);
          }
        });
      });
    });
  });
  describe('with a spreadsheet containing a defined name that kinda looks like it contains a range', () => {
    it('should not crash', () => {
      const workbook = new ExcelJS.Workbook();
      return workbook.xlsx.read(
        fs.createReadStream('./fixtures/xlsx/bogus-defined-name.xlsx')
      );
    });
  });
});
