"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const base_xform_1 = __importDefault(require("../base-xform"));
const vml_shape_xform_1 = __importDefault(require("./vml-shape-xform"));
// This class is (currently) single purposed to insert the triangle
// drawing icons on commented cells
class VmlNotesXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'v:shape': new vml_shape_xform_1.default(),
        };
    }
    get tag() {
        return 'xml';
    }
    render(xmlStream, model) {
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode(this.tag, VmlNotesXform.DRAWING_ATTRIBUTES);
        xmlStream.openNode('o:shapelayout', { 'v:ext': 'edit' });
        xmlStream.leafNode('o:idmap', { 'v:ext': 'edit', data: 1 });
        xmlStream.closeNode();
        xmlStream.openNode('v:shapetype', {
            id: '_x0000_t202',
            coordsize: '21600,21600',
            'o:spt': 202,
            path: 'm,l,21600r21600,l21600,xe',
        });
        xmlStream.leafNode('v:stroke', { joinstyle: 'miter' });
        xmlStream.leafNode('v:path', { gradientshapeok: 't', 'o:connecttype': 'rect' });
        xmlStream.closeNode();
        model.comments.forEach((item, index) => {
            this.map['v:shape'].render(xmlStream, item, index);
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
                    comments: [],
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
                this.model.comments.push(this.parser.model);
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
VmlNotesXform.DRAWING_ATTRIBUTES = {
    'xmlns:v': 'urn:schemas-microsoft-com:vml',
    'xmlns:o': 'urn:schemas-microsoft-com:office:office',
    'xmlns:x': 'urn:schemas-microsoft-com:office:excel',
};
exports.default = VmlNotesXform;
