"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbookReader = exports.WorkbookWriter = exports.ModelContainer = exports.Workbook = void 0;
const workbook_1 = __importDefault(require("./doc/workbook"));
exports.Workbook = workbook_1.default;
const modelcontainer_1 = __importDefault(require("./doc/modelcontainer"));
exports.ModelContainer = modelcontainer_1.default;
const workbook_writer_1 = __importDefault(require("./stream/xlsx/workbook-writer"));
exports.WorkbookWriter = workbook_writer_1.default;
const workbook_reader_1 = __importDefault(require("./stream/xlsx/workbook-reader"));
exports.WorkbookReader = workbook_reader_1.default;
const Enums = __importStar(require("./doc/enums"));
__exportStar(require("./doc/enums"), exports);
const ExcelJS = {
    Workbook: workbook_1.default,
    ModelContainer: modelcontainer_1.default,
    stream: {
        xlsx: {
            WorkbookWriter: workbook_writer_1.default,
            WorkbookReader: workbook_reader_1.default,
        },
    },
    ...Enums,
};
exports.default = ExcelJS;
