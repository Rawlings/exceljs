/* eslint-disable no-console */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { PassThrough } from 'stream';
import ExcelJS from '#src/index';

console.log('Copying bundle.js to public folder');
fs.createReadStream(path.join(__dirname, '../../dist/exceljs.min.js')).pipe(
  fs.createWriteStream(path.join(__dirname, 'public/exceljs.min.js'))
);
fs.createReadStream(path.join(__dirname, '../../dist/exceljs.js')).pipe(
  fs.createWriteStream(path.join(__dirname, 'public/exceljs.js'))
);

const server = http.createServer((req: any, res: any) => {
  if (req.method === 'POST' && req.url === '/api/upload') {
    const wb = new ExcelJS.Workbook();

    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('finish', () => {
      const base64 = Buffer.concat(chunks);

      wb.xlsx.load(base64).then(() => {
        const ws = wb.getWorksheet('blort')!;

        console.log('XLSX uploaded:');
        console.log('A1', ws.getCell('A1').value);
        console.log('A2', ws.getCell('A2').value);

        ws.getCell('A1').value = 'Hey Ho!';
        ws.getCell('A2').value = 14;

        const outStream = new PassThrough();
        wb.xlsx.write(outStream).then(() => {
          outStream.pipe(res);
        });
      });
    });

    req.pipe(stream);
    return;
  }

  const safePath = path
    .normalize(req.url === '/' ? '/index.html' : req.url || '/index.html')
    .replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, 'public', safePath);

  fs.readFile(filePath, (err: any, data: any) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.json') contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(3003, () => {
  console.log('Listening on port 3003');
});
