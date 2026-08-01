"use strict";
const ExcelJS = {
    Workbook: require('./doc/workbook'),
};
const Enums = require('./doc/enums');
Object.keys(Enums).forEach((key) => {
    ExcelJS[key] = Enums[key];
});
module.exports = ExcelJS;
