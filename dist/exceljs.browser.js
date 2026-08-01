"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExcelJS = {
    Workbook: require('./doc/workbook'),
};
const enums_1 = __importDefault(require("./doc/enums"));
Object.keys(enums_1.default).forEach((key) => {
    ExcelJS[key] = enums_1.default[key];
});
exports.default = ExcelJS;
