"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class BooleanXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.tag = options.tag;
        this.attr = options.attr;
    }
    render(xmlStream, model) {
        if (model) {
            xmlStream.openNode(this.tag);
            xmlStream.closeNode();
        }
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            this.model = true;
        }
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = BooleanXform;
