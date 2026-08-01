"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
class FExtXform extends base_xform_1.default {
    get tag() {
        return 'xm:f';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, null, model);
    }
    parseOpen() {
        this.model = '';
    }
    parseText(text) {
        this.model += text;
    }
    parseClose(name) {
        return name !== this.tag;
    }
}
exports.default = FExtXform;
