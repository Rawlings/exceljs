"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class CustomFilterXform extends base_xform_1.default {
    get tag() {
        return 'customFilter';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            val: model.val,
            operator: model.operator,
        });
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            this.model = {
                val: node.attributes.val,
                operator: node.attributes.operator,
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
exports.default = CustomFilterXform;
