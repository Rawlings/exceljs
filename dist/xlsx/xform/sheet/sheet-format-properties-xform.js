"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const base_xform_1 = __importDefault(require("../base-xform"));
class SheetFormatPropertiesXform extends base_xform_1.default {
    get tag() {
        return 'sheetFormatPr';
    }
    render(xmlStream, model) {
        if (model) {
            const attributes = {
                defaultRowHeight: model.defaultRowHeight,
                outlineLevelRow: model.outlineLevelRow,
                outlineLevelCol: model.outlineLevelCol,
                'x14ac:dyDescent': model.dyDescent,
            };
            if (model.defaultColWidth) {
                attributes.defaultColWidth = model.defaultColWidth;
            }
            // default value for 'defaultRowHeight' is 15, this should not be 'custom'
            if (!model.defaultRowHeight || model.defaultRowHeight !== 15) {
                attributes.customHeight = '1';
            }
            if (under_dash_1.default.some(attributes, (value) => value !== undefined)) {
                xmlStream.leafNode('sheetFormatPr', attributes);
            }
        }
    }
    parseOpen(node) {
        if (node.name === 'sheetFormatPr') {
            this.model = {
                defaultRowHeight: parseFloat(node.attributes.defaultRowHeight || '0'),
                dyDescent: parseFloat(node.attributes['x14ac:dyDescent'] || '0'),
                outlineLevelRow: parseInt(node.attributes.outlineLevelRow || '0', 10),
                outlineLevelCol: parseInt(node.attributes.outlineLevelCol || '0', 10),
            };
            if (node.attributes.defaultColWidth) {
                this.model.defaultColWidth = parseFloat(node.attributes.defaultColWidth);
            }
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = SheetFormatPropertiesXform;
