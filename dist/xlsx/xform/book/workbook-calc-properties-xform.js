"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class WorkbookCalcPropertiesXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.leafNode('calcPr', {
            calcId: 171027,
            fullCalcOnLoad: model.fullCalcOnLoad ? 1 : undefined,
        });
    }
    parseOpen(node) {
        if (node.name === 'calcPr') {
            this.model = {};
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = WorkbookCalcPropertiesXform;
