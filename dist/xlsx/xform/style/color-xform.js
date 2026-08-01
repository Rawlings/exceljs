"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
// Color encapsulates translation from color model to/from xlsx
class ColorXform extends base_xform_1.default {
    constructor(name) {
        super();
        // this.name controls the xm node name
        this.name = name || 'color';
    }
    get tag() {
        return this.name;
    }
    render(xmlStream, model) {
        if (model) {
            xmlStream.openNode(this.name);
            if (model.argb) {
                xmlStream.addAttribute('rgb', model.argb);
            }
            else if (model.theme !== undefined) {
                xmlStream.addAttribute('theme', model.theme);
                if (model.tint !== undefined) {
                    xmlStream.addAttribute('tint', model.tint);
                }
            }
            else if (model.indexed !== undefined) {
                xmlStream.addAttribute('indexed', model.indexed);
            }
            else {
                xmlStream.addAttribute('auto', '1');
            }
            xmlStream.closeNode();
            return true;
        }
        return false;
    }
    parseOpen(node) {
        if (node.name === this.name) {
            if (node.attributes.rgb) {
                this.model = { argb: node.attributes.rgb };
            }
            else if (node.attributes.theme) {
                this.model = { theme: parseInt(node.attributes.theme, 10) };
                if (node.attributes.tint) {
                    this.model.tint = parseFloat(node.attributes.tint);
                }
            }
            else if (node.attributes.indexed) {
                this.model = { indexed: parseInt(node.attributes.indexed, 10) };
            }
            else {
                this.model = undefined;
            }
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = ColorXform;
