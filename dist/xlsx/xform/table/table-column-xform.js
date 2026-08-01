"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class TableColumnXform extends base_xform_1.default {
    get tag() {
        return 'tableColumn';
    }
    prepare(model, options) {
        model.id = options.index + 1;
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            id: model.id.toString(),
            name: model.name,
            totalsRowLabel: model.totalsRowLabel,
            totalsRowFunction: model.totalsRowFunction,
            dxfId: model.dxfId,
        });
        return true;
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            const { attributes } = node;
            this.model = {
                name: attributes.name,
                totalsRowLabel: attributes.totalsRowLabel,
                totalsRowFunction: attributes.totalsRowFunction,
                dxfId: attributes.dxfId,
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
exports.default = TableColumnXform;
