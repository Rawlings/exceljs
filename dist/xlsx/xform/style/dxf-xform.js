"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const alignment_xform_1 = __importDefault(require("./alignment-xform"));
const border_xform_1 = __importDefault(require("./border-xform"));
const fill_xform_1 = __importDefault(require("./fill-xform"));
const font_xform_1 = __importDefault(require("./font-xform"));
const numfmt_xform_1 = __importDefault(require("./numfmt-xform"));
const protection_xform_1 = __importDefault(require("./protection-xform"));
// <xf numFmtId="[numFmtId]" fontId="[fontId]" fillId="[fillId]" borderId="[xf.borderId]" xfId="[xfId]">
//   Optional <alignment>
//   Optional <protection>
// </xf>
// Style assists translation from style model to/from xlsx
class DxfXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            alignment: new alignment_xform_1.default(),
            border: new border_xform_1.default(),
            fill: new fill_xform_1.default(),
            font: new font_xform_1.default(),
            numFmt: new numfmt_xform_1.default(),
            protection: new protection_xform_1.default(),
        };
    }
    get tag() {
        return 'dxf';
    }
    // how do we generate dxfid?
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        if (model.font) {
            this.map.font.render(xmlStream, model.font);
        }
        if (model.numFmt && model.numFmtId) {
            const numFmtModel = { id: model.numFmtId, formatCode: model.numFmt };
            this.map.numFmt.render(xmlStream, numFmtModel);
        }
        if (model.fill) {
            this.map.fill.render(xmlStream, model.fill);
        }
        if (model.alignment) {
            this.map.alignment.render(xmlStream, model.alignment);
        }
        if (model.border) {
            this.map.border.render(xmlStream, model.border);
        }
        if (model.protection) {
            this.map.protection.render(xmlStream, model.protection);
        }
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case this.tag:
                // this node is often repeated. Need to reset children
                this.reset();
                return true;
            default:
                this.parser = this.map[node.name];
                if (this.parser) {
                    this.parser.parseOpen(node);
                }
                return true;
        }
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.parser = undefined;
            }
            return true;
        }
        if (name === this.tag) {
            this.model = {
                alignment: this.map.alignment.model,
                border: this.map.border.model,
                fill: this.map.fill.model,
                font: this.map.font.model,
                numFmt: this.map.numFmt.model,
                protection: this.map.protection.model,
            };
            return false;
        }
        return true;
    }
}
exports.default = DxfXform;
