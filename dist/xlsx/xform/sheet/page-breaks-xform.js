"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class PageBreaksXform extends base_xform_1.default {
    get tag() {
        return 'brk';
    }
    render(xmlStream, model) {
        xmlStream.leafNode('brk', model);
    }
    parseOpen(node) {
        if (node.name === 'brk') {
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
exports.default = PageBreaksXform;
