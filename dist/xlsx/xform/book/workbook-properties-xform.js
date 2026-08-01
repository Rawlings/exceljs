"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class WorksheetPropertiesXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.leafNode('workbookPr', {
            date1904: model.date1904 ? 1 : undefined,
            defaultThemeVersion: 164011,
            filterPrivacy: 1,
        });
    }
    parseOpen(node) {
        if (node.name === 'workbookPr') {
            this.model = {
                date1904: node.attributes.date1904 === '1',
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
exports.default = WorksheetPropertiesXform;
