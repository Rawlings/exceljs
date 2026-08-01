"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class IntegerXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.tag = options.tag;
        this.attr = options.attr;
        this.attrs = options.attrs;
        // option to render zero
        this.zero = options.zero;
    }
    render(xmlStream, model) {
        // int is different to float in that zero is not rendered
        if (model || this.zero) {
            xmlStream.openNode(this.tag);
            if (this.attrs) {
                xmlStream.addAttributes(this.attrs);
            }
            if (this.attr) {
                xmlStream.addAttribute(this.attr, model);
            }
            else {
                xmlStream.writeText(model);
            }
            xmlStream.closeNode();
        }
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            if (this.attr) {
                this.model = parseInt(node.attributes[this.attr], 10);
            }
            else {
                this.text = [];
            }
            return true;
        }
        return false;
    }
    parseText(text) {
        if (!this.attr) {
            this.text.push(text);
        }
    }
    parseClose() {
        if (!this.attr) {
            this.model = parseInt(this.text.join('') || 0, 10);
        }
        return false;
    }
}
exports.default = IntegerXform;
