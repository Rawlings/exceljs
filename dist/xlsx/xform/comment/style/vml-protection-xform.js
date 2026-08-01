"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
class VmlProtectionXform extends base_xform_1.default {
    constructor(model) {
        super();
        this._model = model;
    }
    get tag() {
        return this._model && this._model.tag;
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, null, model);
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.text = '';
                return true;
            default:
                return false;
        }
    }
    parseText(text) {
        this.text = text;
    }
    parseClose() {
        return false;
    }
}
exports.default = VmlProtectionXform;
