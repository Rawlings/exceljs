"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../../../utils/utils"));
const base_xform_1 = __importDefault(require("../base-xform"));
class WorksheetXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.leafNode('sheet', {
            sheetId: model.id,
            name: model.name,
            state: model.state,
            'r:id': model.rId,
        });
    }
    parseOpen(node) {
        if (node.name === 'sheet') {
            this.model = {
                name: utils_1.default.xmlDecode(node.attributes.name),
                id: parseInt(node.attributes.sheetId, 10),
                state: node.attributes.state,
                rId: node.attributes['r:id'],
            };
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = WorksheetXform;
