"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_xform_1 = __importDefault(require("./text-xform"));
const font_xform_1 = __importDefault(require("../style/font-xform"));
const base_xform_1 = __importDefault(require("../base-xform"));
// <r>
//   <rPr>
//     <sz val="11"/>
//     <color theme="1" tint="5"/>
//     <rFont val="Calibri"/>
//     <family val="2"/>
//     <scheme val="minor"/>
//   </rPr>
//   <t xml:space="preserve"> is </t>
// </r>
class RichTextXform extends base_xform_1.default {
    constructor(model) {
        super();
        this.model = model;
    }
    get tag() {
        return 'r';
    }
    get textXform() {
        return this._textXform || (this._textXform = new text_xform_1.default());
    }
    get fontXform() {
        return this._fontXform || (this._fontXform = new font_xform_1.default(RichTextXform.FONT_OPTIONS));
    }
    render(xmlStream, model) {
        model = model || this.model;
        xmlStream.openNode('r');
        if (model.font) {
            this.fontXform.render(xmlStream, model.font);
        }
        this.textXform.render(xmlStream, model.text);
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'r':
                this.model = {};
                return true;
            case 't':
                this.parser = this.textXform;
                this.parser.parseOpen(node);
                return true;
            case 'rPr':
                this.parser = this.fontXform;
                this.parser.parseOpen(node);
                return true;
            default:
                return false;
        }
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        switch (name) {
            case 'r':
                return false;
            case 't':
                this.model.text = this.parser.model;
                this.parser = undefined;
                return true;
            case 'rPr':
                this.model.font = this.parser.model;
                this.parser = undefined;
                return true;
            default:
                if (this.parser) {
                    this.parser.parseClose(name);
                }
                return true;
        }
    }
}
RichTextXform.FONT_OPTIONS = {
    tagName: 'rPr',
    fontNameTag: 'rFont',
};
exports.default = RichTextXform;
