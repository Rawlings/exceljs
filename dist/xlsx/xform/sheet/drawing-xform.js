"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class DrawingXform extends base_xform_1.default {
    get tag() {
        return 'drawing';
    }
    render(xmlStream, model) {
        if (model) {
            xmlStream.leafNode(this.tag, { 'r:id': model.rId });
        }
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {
                    rId: node.attributes['r:id'],
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
exports.default = DrawingXform;
