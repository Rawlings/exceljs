import http from 'node:http';
import { describe, it, beforeAll, afterAll } from 'vitest';
import testutils from '../../helpers/index';
import Excel from '../../../src/index';

describe('Express / HTTP Server', () => {
  let server: http.Server;
  beforeAll(async () => {
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
    await new Promise<void>((resolve) => server.listen(3003, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
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
