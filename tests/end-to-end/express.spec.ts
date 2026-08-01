import http from 'http';
import testutils from '../utils/index';
import Excel from '../../src/exceljs.nodejs';

describe('Express / HTTP Server', () => {
  let server: http.Server;
  beforeAll((done: any) => {
    server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
      if (req.url === '/workbook') {
        const wb = testutils.createTestBook(new Excel.Workbook(), 'xlsx');
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename=Report.xlsx');
        wb.xlsx.write(res).then(() => {
          res.end();
        });
      }
    });
    server.listen(3003, done);
  });

  afterAll((done: any) => {
    server.close(done);
  });

  it('downloads a workbook over http', async () => {
    const wb2 = new Excel.Workbook();
    await new Promise<void>((resolve: any, reject: any) => {
      http.get('http://127.0.0.1:3003/workbook', async (res: any) => {
        try {
          await wb2.xlsx.read(res as any);
          testutils.checkTestBook(wb2, 'xlsx');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
