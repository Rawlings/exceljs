"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class WorkbookPivotCacheXform extends base_xform_1.default {
    render(xmlStream, model) {
        xmlStream.leafNode('pivotCache', {
            cacheId: model.cacheId,
            'r:id': model.rId,
        });
    }
    parseOpen(node) {
        if (node.name === 'pivotCache') {
            this.model = {
                cacheId: node.attributes.cacheId,
                rId: node.attributes['r:id'],
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
exports.default = WorkbookPivotCacheXform;
