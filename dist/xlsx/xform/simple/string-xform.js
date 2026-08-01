"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class StringXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.tag = options.tag;
        this.attr = options.attr;
        this.attrs = options.attrs;
    }
    render(xmlStream, model) {
        if (model !== undefined) {
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
                this.model = node.attributes[this.attr];
            }
            else {
                this.text = [];
            }
        }
    }
    parseText(text) {
        if (!this.attr) {
            this.text.push(text);
        }
    }
    parseClose() {
        if (!this.attr) {
            this.model = this.text.join('');
        }
        return false;
    }
}
exports.default = StringXform;
