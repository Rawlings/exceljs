"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class BlipXform extends base_xform_1.default {
    get tag() {
        return 'a:blip';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'r:embed': model.rId,
            cstate: 'print',
        });
        // TODO: handle children (e.g. a:extLst=>a:ext=>a14:useLocalDpi
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {
                    rId: node.attributes['r:embed'],
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
                // unprocessed internal nodes
                return true;
        }
    }
}
exports.default = BlipXform;
