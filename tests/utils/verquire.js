// this module allows specs to switch between source code and built dist
const libs = {};
const basePath = (function () {
  if (process.env.EXCEL_BUILD === "dist") {
    libs.exceljs = require("../../dist/index.cjs");
    return "../../dist/";
  }
  libs.exceljs = require("../../src/exceljs.nodejs");
  return "../../src/";
})();

module.exports = function verquire(path) {
  if (!libs[path]) {
    try {
      libs[path] = require(basePath + path);
    } catch {
      libs[path] = require("../../src/" + path);
    }
  }
  return libs[path];
};
