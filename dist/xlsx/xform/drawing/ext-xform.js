"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
/** https://en.wikipedia.org/wiki/Office_Open_XML_file_formats#DrawingML */
const EMU_PER_PIXEL_AT_96_DPI = 9525;
class ExtXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.tag = options.tag;
        this.map = {};
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        const width = Math.floor(model.width * EMU_PER_PIXEL_AT_96_DPI);
        const height = Math.floor(model.height * EMU_PER_PIXEL_AT_96_DPI);
        xmlStream.addAttribute('cx', width);
        xmlStream.addAttribute('cy', height);
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            this.model = {
                width: parseInt(node.attributes.cx || '0', 10) / EMU_PER_PIXEL_AT_96_DPI,
                height: parseInt(node.attributes.cy || '0', 10) / EMU_PER_PIXEL_AT_96_DPI,
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
exports.default = ExtXform;
