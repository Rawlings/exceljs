"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExcelJS = {
    Workbook: require('./doc/workbook'),
    ModelContainer: require('./doc/modelcontainer'),
    stream: {
        xlsx: {
            WorkbookWriter: require('./stream/xlsx/workbook-writer'),
            WorkbookReader: require('./stream/xlsx/workbook-reader'),
        },
    },
};
Object.assign(ExcelJS, require('./doc/enums'));
exports.default = ExcelJS;
