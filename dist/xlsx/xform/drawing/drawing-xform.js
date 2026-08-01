"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const col_cache_1 = __importDefault(require("../../../utils/col-cache"));
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const base_xform_1 = __importDefault(require("../base-xform"));
const two_cell_anchor_xform_1 = __importDefault(require("./two-cell-anchor-xform"));
const one_cell_anchor_xform_1 = __importDefault(require("./one-cell-anchor-xform"));
function getAnchorType(model) {
    const range = typeof model.range === 'string' ? col_cache_1.default.decode(model.range) : model.range;
    return range.br ? 'xdr:twoCellAnchor' : 'xdr:oneCellAnchor';
}
class DrawingXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'xdr:twoCellAnchor': new two_cell_anchor_xform_1.default(),
            'xdr:oneCellAnchor': new one_cell_anchor_xform_1.default(),
        };
    }
    prepare(model) {
        model.anchors.forEach((item, index) => {
            item.anchorType = getAnchorType(item);
            const anchor = this.map[item.anchorType];
            anchor.prepare(item, { index });
        });
    }
    get tag() {
        return 'xdr:wsDr';
    }
    render(xmlStream, model) {
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode(this.tag, DrawingXform.DRAWING_ATTRIBUTES);
        model.anchors.forEach((item) => {
            const anchor = this.map[item.anchorType];
            anchor.render(xmlStream, item);
        });
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case this.tag:
                this.reset();
                this.model = {
                    anchors: [],
                };
                break;
            default:
                this.parser = this.map[node.name];
                if (this.parser) {
                    this.parser.parseOpen(node);
                }
                break;
        }
        return true;
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.model.anchors.push(this.parser.model);
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                return false;
            default:
                // could be some unrecognised tags
                return true;
        }
    }
    reconcile(model, options) {
        model.anchors.forEach((anchor) => {
            if (anchor.br) {
                this.map['xdr:twoCellAnchor'].reconcile(anchor, options);
            }
            else {
                this.map['xdr:oneCellAnchor'].reconcile(anchor, options);
            }
        });
    }
}
DrawingXform.DRAWING_ATTRIBUTES = {
    'xmlns:xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
    'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
};
exports.default = DrawingXform;
