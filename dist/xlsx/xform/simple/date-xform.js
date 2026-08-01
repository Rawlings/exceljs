"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class DateXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.tag = options.tag;
        this.attr = options.attr;
        this.attrs = options.attrs;
        this._format =
            options.format ||
                function (dt) {
                    try {
                        if (Number.isNaN(dt.getTime()))
                            return '';
                        return dt.toISOString();
                    }
                    catch (e) {
                        return '';
                    }
                };
        this._parse =
            options.parse ||
                function (str) {
                    return new Date(str);
                };
    }
    render(xmlStream, model) {
        if (model) {
            xmlStream.openNode(this.tag);
            if (this.attrs) {
                xmlStream.addAttributes(this.attrs);
            }
            if (this.attr) {
                xmlStream.addAttribute(this.attr, this._format(model));
            }
            else {
                xmlStream.writeText(this._format(model));
            }
            xmlStream.closeNode();
        }
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            if (this.attr) {
                this.model = this._parse(node.attributes[this.attr]);
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
            this.model = this._parse(this.text.join(''));
        }
        return false;
    }
}
exports.default = DateXform;
