"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
// render the triangle in the cell for the comment
class VmlAnchorXform extends base_xform_1.default {
    get tag() {
        return 'x:Anchor';
    }
    getAnchorRect(anchor) {
        const l = Math.floor(anchor.left);
        const lf = Math.floor((anchor.left - l) * 68);
        const t = Math.floor(anchor.top);
        const tf = Math.floor((anchor.top - t) * 18);
        const r = Math.floor(anchor.right);
        const rf = Math.floor((anchor.right - r) * 68);
        const b = Math.floor(anchor.bottom);
        const bf = Math.floor((anchor.bottom - b) * 18);
        return [l, lf, t, tf, r, rf, b, bf];
    }
    getDefaultRect(ref) {
        const l = ref.col;
        const lf = 6;
        const t = Math.max(ref.row - 2, 0);
        const tf = 14;
        const r = l + 2;
        const rf = 2;
        const b = t + 4;
        const bf = 16;
        return [l, lf, t, tf, r, rf, b, bf];
    }
    render(xmlStream, model) {
        const rect = model.anchor
            ? this.getAnchorRect(model.anchor)
            : this.getDefaultRect(model.refAddress);
        xmlStream.leafNode('x:Anchor', null, rect.join(', '));
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.text = '';
                return true;
            default:
                return false;
        }
    }
    parseText(text) {
        this.text = text;
    }
    parseClose() {
        return false;
    }
}
exports.default = VmlAnchorXform;
