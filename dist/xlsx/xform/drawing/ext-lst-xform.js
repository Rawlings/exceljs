"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class ExtLstXform extends base_xform_1.default {
    get tag() {
        return 'a:extLst';
    }
    render(xmlStream) {
        xmlStream.openNode(this.tag);
        xmlStream.openNode('a:ext', {
            uri: '{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}',
        });
        xmlStream.leafNode('a16:creationId', {
            'xmlns:a16': 'http://schemas.microsoft.com/office/drawing/2014/main',
            id: '{00000000-0008-0000-0000-000002000000}',
        });
        xmlStream.closeNode();
        xmlStream.closeNode();
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
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
                // unprocessed internal nodes
                return true;
        }
    }
}
exports.default = ExtLstXform;
