"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class HyperlinkXform extends base_xform_1.default {
    get tag() {
        return 'hyperlink';
    }
    render(xmlStream, model) {
        if (this.isInternalLink(model)) {
            xmlStream.leafNode('hyperlink', {
                ref: model.address,
                'r:id': model.rId,
                tooltip: model.tooltip,
                location: model.target,
            });
        }
        else {
            xmlStream.leafNode('hyperlink', {
                ref: model.address,
                'r:id': model.rId,
                tooltip: model.tooltip,
            });
        }
    }
    parseOpen(node) {
        if (node.name === 'hyperlink') {
            this.model = {
                address: node.attributes.ref,
                rId: node.attributes['r:id'],
                tooltip: node.attributes.tooltip,
            };
            // This is an internal link
            if (node.attributes.location) {
                this.model.target = node.attributes.location;
            }
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
    isInternalLink(model) {
        // @example: Sheet2!D3, return true
        return model.target && /^[^!]+![a-zA-Z]+[\d]+$/.test(model.target);
    }
}
exports.default = HyperlinkXform;
