"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class UnderlineXform extends base_xform_1.default {
    static Attributes;
    constructor(model) {
        super();
        this.model = model;
    }
    get tag() {
        return 'u';
    }
    render(xmlStream, model) {
        model = model || this.model;
        if (model === true) {
            xmlStream.leafNode('u');
        }
        else {
            const attr = UnderlineXform.Attributes[model];
            if (attr) {
                xmlStream.leafNode('u', attr);
            }
        }
    }
    parseOpen(node) {
        if (node.name === 'u') {
            this.model = node.attributes.val || true;
        }
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
UnderlineXform.Attributes = {
    single: {},
    double: { val: 'double' },
    singleAccounting: { val: 'singleAccounting' },
    doubleAccounting: { val: 'doubleAccounting' },
};
exports.default = UnderlineXform;
