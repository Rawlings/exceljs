import WorksheetWriter from '#src/stream/xlsx/worksheet-writer';
import { PassThrough } from 'node:stream';

describe('Workbook Writer', () => {
  it('generates valid xml even when there is no data', () =>
    // issue: https://github.com/guyonroche/exceljs/issues/99
    // PR: https://github.com/guyonroche/exceljs/pull/255
    new Promise((resolve: any, reject: any) => {
      const mockWorkbook = {
        _openStream() {
          return this.stream;
        },
        stream: new PassThrough(),
      };
      mockWorkbook.stream.on('finish', () => {
        try {
          const xml = mockWorkbook.stream.read().toString();
          expect(xml).to.be.a('string');
          expect(xml).to.include('<?xml');
          expect(xml).to.include('</worksheet>');
          resolve(undefined as any);
        } catch (error) {
          reject(error);
        }
      });

      const writer = new WorksheetWriter({
        id: 1,
        workbook: mockWorkbook,
      });

      writer.commit();
    }));
});
