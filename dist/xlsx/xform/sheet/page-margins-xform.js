"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const base_xform_1 = __importDefault(require("../base-xform"));
class PageMarginsXform extends base_xform_1.default {
    get tag() {
        return 'pageMargins';
    }
    render(xmlStream, model) {
        if (model) {
            const attributes = {
                left: model.left,
                right: model.right,
                top: model.top,
                bottom: model.bottom,
                header: model.header,
                footer: model.footer,
            };
            if (under_dash_1.default.some(attributes, (value) => value !== undefined)) {
                xmlStream.leafNode(this.tag, attributes);
            }
        }
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {
                    left: parseFloat(node.attributes.left || 0.7),
                    right: parseFloat(node.attributes.right || 0.7),
                    top: parseFloat(node.attributes.top || 0.75),
                    bottom: parseFloat(node.attributes.bottom || 0.75),
                    header: parseFloat(node.attributes.header || 0.3),
                    footer: parseFloat(node.attributes.footer || 0.3),
                };
                return true;
            default:
                return false;
        }
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = PageMarginsXform;
