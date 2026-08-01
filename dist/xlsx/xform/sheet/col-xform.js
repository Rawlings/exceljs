"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../../../utils/utils"));
const base_xform_1 = __importDefault(require("../base-xform"));
class ColXform extends base_xform_1.default {
    get tag() {
        return 'col';
    }
    prepare(model, options) {
        const styleId = options.styles.addStyleModel(model.style || {});
        if (styleId) {
            model.styleId = styleId;
        }
    }
    render(xmlStream, model) {
        xmlStream.openNode('col');
        xmlStream.addAttribute('min', model.min);
        xmlStream.addAttribute('max', model.max);
        if (model.width) {
            xmlStream.addAttribute('width', model.width);
        }
        if (model.styleId) {
            xmlStream.addAttribute('style', model.styleId);
        }
        if (model.hidden) {
            xmlStream.addAttribute('hidden', '1');
        }
        if (model.bestFit) {
            xmlStream.addAttribute('bestFit', '1');
        }
        if (model.outlineLevel) {
            xmlStream.addAttribute('outlineLevel', model.outlineLevel);
        }
        if (model.collapsed) {
            xmlStream.addAttribute('collapsed', '1');
        }
        xmlStream.addAttribute('customWidth', '1');
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (node.name === 'col') {
            const model = (this.model = {
                min: parseInt(node.attributes.min || '0', 10),
                max: parseInt(node.attributes.max || '0', 10),
                width: node.attributes.width === undefined
                    ? undefined
                    : parseFloat(node.attributes.width || '0'),
            });
            if (node.attributes.style) {
                model.styleId = parseInt(node.attributes.style, 10);
            }
            if (utils_1.default.parseBoolean(node.attributes.hidden)) {
                model.hidden = true;
            }
            if (utils_1.default.parseBoolean(node.attributes.bestFit)) {
                model.bestFit = true;
            }
            if (node.attributes.outlineLevel) {
                model.outlineLevel = parseInt(node.attributes.outlineLevel, 10);
            }
            if (utils_1.default.parseBoolean(node.attributes.collapsed)) {
                model.collapsed = true;
            }
            return true;
        }
        return false;
    }
    parseText() { }
    parseClose() {
        return false;
    }
    reconcile(model, options) {
        // reconcile column styles
        if (model.styleId) {
            model.style = options.styles.getStyleModel(model.styleId);
        }
    }
}
exports.default = ColXform;
