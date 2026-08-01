"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class VmlTextboxXform extends base_xform_1.default {
    get tag() {
        return 'v:textbox';
    }
    conversionUnit(value, multiple, unit) {
        return `${parseFloat(value) * multiple.toFixed(2)}${unit}`;
    }
    reverseConversionUnit(inset) {
        return (inset || '').split(',').map((margin) => {
            return Number(parseFloat(this.conversionUnit(parseFloat(margin), 0.1, '')).toFixed(2));
        });
    }
    render(xmlStream, model) {
        const attributes = {
            style: 'mso-direction-alt:auto',
        };
        if (model && model.note) {
            let { inset } = model.note && model.note.margins;
            if (Array.isArray(inset)) {
                inset = inset
                    .map((margin) => {
                    return this.conversionUnit(margin, 10, 'mm');
                })
                    .join(',');
            }
            if (inset) {
                attributes.inset = inset;
            }
        }
        xmlStream.openNode('v:textbox', attributes);
        xmlStream.leafNode('div', { style: 'text-align:left' });
        xmlStream.closeNode();
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {
                    inset: this.reverseConversionUnit(node.attributes.inset),
                };
                return true;
            default:
                return true;
        }
    }
    parseText() { }
    parseClose(name) {
        switch (name) {
            case this.tag:
                return false;
            default:
                return true;
        }
    }
}
exports.default = VmlTextboxXform;
