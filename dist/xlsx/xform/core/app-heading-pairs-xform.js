"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class AppHeadingPairsXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.openNode('HeadingPairs');
        xmlStream.openNode('vt:vector', { size: 2, baseType: 'variant' });
        xmlStream.openNode('vt:variant');
        xmlStream.leafNode('vt:lpstr', undefined, 'Worksheets');
        xmlStream.closeNode();
        xmlStream.openNode('vt:variant');
        xmlStream.leafNode('vt:i4', undefined, model.length);
        xmlStream.closeNode();
        xmlStream.closeNode();
        xmlStream.closeNode();
    }
    parseOpen(node) {
        // no parsing
        return node.name === 'HeadingPairs';
    }
    parseText() { }
    parseClose(name) {
        return name !== 'HeadingPairs';
    }
}
exports.default = AppHeadingPairsXform;
