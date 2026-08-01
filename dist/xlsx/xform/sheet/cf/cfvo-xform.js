"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
class CfvoXform extends base_xform_1.default {
    get tag() {
        return 'cfvo';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            type: model.type,
            val: model.value,
        });
    }
    parseOpen(node) {
        this.model = {
            type: node.attributes.type,
            value: base_xform_1.default.toFloatValue(node.attributes.val),
        };
    }
    parseClose(name) {
        return name !== this.tag;
    }
}
exports.default = CfvoXform;
