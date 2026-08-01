"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class CNvPicPrXform extends base_xform_1.default {
    get tag() {
        return 'xdr:cNvPicPr';
    }
    render(xmlStream) {
        xmlStream.openNode(this.tag);
        xmlStream.leafNode('a:picLocks', {
            noChangeAspect: '1',
        });
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
exports.default = CNvPicPrXform;
