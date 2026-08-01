"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class DimensionXform extends base_xform_1.default {
    get tag() {
        return 'dimension';
    }
    render(xmlStream, model) {
        if (model) {
            xmlStream.leafNode('dimension', { ref: model });
        }
    }
    parseOpen(node) {
        if (node.name === 'dimension') {
            this.model = node.attributes.ref;
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = DimensionXform;
