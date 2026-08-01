"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class TableStyleInfoXform extends base_xform_1.default {
    get tag() {
        return 'tableStyleInfo';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            name: model.theme ? model.theme : undefined,
            showFirstColumn: model.showFirstColumn ? '1' : '0',
            showLastColumn: model.showLastColumn ? '1' : '0',
            showRowStripes: model.showRowStripes ? '1' : '0',
            showColumnStripes: model.showColumnStripes ? '1' : '0',
        });
        return true;
    }
    parseOpen(node) {
        if (node.name === this.tag) {
            const { attributes } = node;
            this.model = {
                theme: attributes.name ? attributes.name : null,
                showFirstColumn: attributes.showFirstColumn === '1',
                showLastColumn: attributes.showLastColumn === '1',
                showRowStripes: attributes.showRowStripes === '1',
                showColumnStripes: attributes.showColumnStripes === '1',
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
exports.default = TableStyleInfoXform;
