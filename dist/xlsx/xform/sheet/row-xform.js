"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const utils_1 = __importDefault(require("../../../utils/utils"));
const cell_xform_1 = __importDefault(require("./cell-xform"));
class RowXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.maxItems = options && options.maxItems;
        this.map = {
            c: new cell_xform_1.default(),
        };
    }
    get tag() {
        return 'row';
    }
    prepare(model, options) {
        const styleId = options.styles.addStyleModel(model.style);
        if (styleId) {
            model.styleId = styleId;
        }
        const cellXform = this.map.c;
        model.cells.forEach((cellModel) => {
            cellXform.prepare(cellModel, options);
        });
    }
    render(xmlStream, model, options) {
        xmlStream.openNode('row');
        xmlStream.addAttribute('r', model.number);
        if (model.height) {
            xmlStream.addAttribute('ht', model.height);
            xmlStream.addAttribute('customHeight', '1');
        }
        if (model.hidden) {
            xmlStream.addAttribute('hidden', '1');
        }
        if (model.min > 0 && model.max > 0 && model.min <= model.max) {
            xmlStream.addAttribute('spans', `${model.min}:${model.max}`);
        }
        if (model.styleId) {
            xmlStream.addAttribute('s', model.styleId);
            xmlStream.addAttribute('customFormat', '1');
        }
        xmlStream.addAttribute('x14ac:dyDescent', '0.25');
        if (model.outlineLevel) {
            xmlStream.addAttribute('outlineLevel', model.outlineLevel);
        }
        if (model.collapsed) {
            xmlStream.addAttribute('collapsed', '1');
        }
        const cellXform = this.map.c;
        model.cells.forEach((cellModel) => {
            cellXform.render(xmlStream, cellModel, options);
        });
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        if (node.name === 'row') {
            this.numRowsSeen += 1;
            const spans = node.attributes.spans
                ? node.attributes.spans.split(':').map((span) => parseInt(span, 10))
                : [undefined, undefined];
            const model = (this.model = {
                number: parseInt(node.attributes.r, 10),
                min: spans[0],
                max: spans[1],
                cells: [],
            });
            if (node.attributes.s) {
                model.styleId = parseInt(node.attributes.s, 10);
            }
            if (utils_1.default.parseBoolean(node.attributes.hidden)) {
                model.hidden = true;
            }
            if (utils_1.default.parseBoolean(node.attributes.bestFit)) {
                model.bestFit = true;
            }
            if (node.attributes.ht) {
                model.height = parseFloat(node.attributes.ht);
            }
            if (node.attributes.outlineLevel) {
                model.outlineLevel = parseInt(node.attributes.outlineLevel, 10);
            }
            if (utils_1.default.parseBoolean(node.attributes.collapsed)) {
                model.collapsed = true;
            }
            return true;
        }
        this.parser = this.map[node.name];
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        return false;
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.model.cells.push(this.parser.model);
                if (this.maxItems && this.model.cells.length > this.maxItems) {
                    throw new Error(`Max column count (${this.maxItems}) exceeded`);
                }
                this.parser = undefined;
            }
            return true;
        }
        return false;
    }
    reconcile(model, options) {
        model.style = model.styleId ? options.styles.getStyleModel(model.styleId) : {};
        if (model.styleId !== undefined) {
            model.styleId = undefined;
        }
        const cellXform = this.map.c;
        model.cells.forEach((cellModel) => {
            cellXform.reconcile(cellModel, options);
        });
    }
}
exports.default = RowXform;
