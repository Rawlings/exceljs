"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class RelationshipXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.leafNode('Relationship', model);
    }
    parseOpen(node) {
        switch (node.name) {
            case 'Relationship':
                this.model = node.attributes;
                return true;
            default:
                return false;
        }
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
exports.default = RelationshipXform;
