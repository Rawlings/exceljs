"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
class CfIconExtXform extends base_xform_1.default {
    get tag() {
        return 'x14:cfIcon';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            iconSet: model.iconSet,
            iconId: model.iconId,
        });
    }
    parseOpen({ attributes }) {
        this.model = {
            iconSet: attributes.iconSet,
            iconId: base_xform_1.default.toIntValue(attributes.iconId),
        };
    }
    parseClose(name) {
        return name !== this.tag;
    }
}
exports.default = CfIconExtXform;
