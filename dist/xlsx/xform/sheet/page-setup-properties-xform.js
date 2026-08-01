"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class PageSetupPropertiesXform extends base_xform_1.default {
    get tag() {
        return 'pageSetUpPr';
    }
    render(xmlStream, model) {
        if (model && model.fitToPage) {
            xmlStream.leafNode(this.tag, {
                fitToPage: model.fitToPage ? '1' : undefined,
            });
            return true;
        }
        return false;
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            this.model = {
                fitToPage: node.attributes.fitToPage === '1',
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
exports.default = PageSetupPropertiesXform;
