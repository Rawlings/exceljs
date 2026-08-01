"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class AppTitlesOfPartsXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.openNode('TitlesOfParts');
        xmlStream.openNode('vt:vector', { size: model.length, baseType: 'lpstr' });
        model.forEach((sheet) => {
            xmlStream.leafNode('vt:lpstr', undefined, sheet.name);
        });
        xmlStream.closeNode();
        xmlStream.closeNode();
    }
    parseOpen(node) {
        // no parsing
        return node.name === 'TitlesOfParts';
    }
    parseText() { }
    parseClose(name) {
        return name !== 'TitlesOfParts';
    }
}
exports.default = AppTitlesOfPartsXform;
