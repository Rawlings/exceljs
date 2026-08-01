const http = require("http");
const { PassThrough } = require("stream");
const testutils = require("../utils/index");
const Excel = verquire("exceljs");

describe("Express / HTTP Server", () => {
  let server;
  before((done) => {
    server = http.createServer((req, res) => {
      if (req.url === "/workbook") {
        const wb = testutils.createTestBook(new Excel.Workbook(), "xlsx");
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader("Content-Disposition", "attachment; filename=Report.xlsx");
        wb.xlsx.write(res).then(() => {
          res.end();
        });
      }
    });
    server.listen(3003, done);
  });

  after((done) => {
    server.close(done);
  });

  it("downloads a workbook over http", async () => {
    const wb2 = new Excel.Workbook();
    await new Promise((resolve, reject) => {
      http.get("http://127.0.0.1:3003/workbook", async (res) => {
        try {
          await wb2.xlsx.read(res);
          testutils.checkTestBook(wb2, "xlsx");
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
});
