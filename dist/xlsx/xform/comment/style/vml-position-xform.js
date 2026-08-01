"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
class VmlPositionXform extends base_xform_1.default {
    constructor(model) {
        super();
        this._model = model;
    }
    get tag() {
        return this._model && this._model.tag;
    }
    render(xmlStream, model, type) {
        if (model === type[2]) {
            xmlStream.leafNode(this.tag);
        }
        else if (this.tag === 'x:SizeWithCells' && model === type[1]) {
            xmlStream.leafNode(this.tag);
        }
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {};
                this.model[this.tag] = true;
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
exports.default = VmlPositionXform;
