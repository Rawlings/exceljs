"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class HLinkClickXform extends base_xform_1.default {
    get tag() {
        return 'a:hlinkClick';
    }
    render(xmlStream, model) {
        if (!(model.hyperlinks && model.hyperlinks.rId)) {
            return;
        }
        xmlStream.leafNode(this.tag, {
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'r:id': model.hyperlinks.rId,
            tooltip: model.hyperlinks.tooltip,
        });
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {
                    hyperlinks: {
                        rId: node.attributes['r:id'],
                        tooltip: node.attributes.tooltip,
                    },
                };
                return true;
            default:
                return true;
        }
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = HLinkClickXform;
