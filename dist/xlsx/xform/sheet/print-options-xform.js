"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const base_xform_1 = __importDefault(require("../base-xform"));
function booleanToXml(model) {
    return model ? '1' : undefined;
}
class PrintOptionsXform extends base_xform_1.default {
    get tag() {
        return 'printOptions';
    }
    render(xmlStream, model) {
        if (model) {
            const attributes = {
                headings: booleanToXml(model.showRowColHeaders),
                gridLines: booleanToXml(model.showGridLines),
                horizontalCentered: booleanToXml(model.horizontalCentered),
                verticalCentered: booleanToXml(model.verticalCentered),
            };
            if (under_dash_1.default.some(attributes, (value) => value !== undefined)) {
                xmlStream.leafNode(this.tag, attributes);
            }
        }
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.model = {
                    showRowColHeaders: node.attributes.headings === '1',
                    showGridLines: node.attributes.gridLines === '1',
                    horizontalCentered: node.attributes.horizontalCentered === '1',
                    verticalCentered: node.attributes.verticalCentered === '1',
                };
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
exports.default = PrintOptionsXform;
