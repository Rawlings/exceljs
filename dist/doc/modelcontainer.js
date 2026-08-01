"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelContainer = void 0;
const xlsx_1 = __importDefault(require("../xlsx/xlsx"));
class ModelContainer {
    model;
    _xlsx;
    constructor(model) {
        this.model = model;
    }
    get xlsx() {
        if (!this._xlsx) {
            this._xlsx = new xlsx_1.default(this);
        }
        return this._xlsx;
    }
}
exports.ModelContainer = ModelContainer;
exports.default = ModelContainer;
