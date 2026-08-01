"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const integer_xform_1 = __importDefault(require("../simple/integer-xform"));
class CellPositionXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.tag = options.tag;
        this.map = {
            'xdr:col': new integer_xform_1.default({ tag: 'xdr:col', zero: true }),
            'xdr:colOff': new integer_xform_1.default({ tag: 'xdr:colOff', zero: true }),
            'xdr:row': new integer_xform_1.default({ tag: 'xdr:row', zero: true }),
            'xdr:rowOff': new integer_xform_1.default({ tag: 'xdr:rowOff', zero: true }),
        };
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        this.map['xdr:col'].render(xmlStream, model.nativeCol);
        this.map['xdr:colOff'].render(xmlStream, model.nativeColOff);
        this.map['xdr:row'].render(xmlStream, model.nativeRow);
        this.map['xdr:rowOff'].render(xmlStream, model.nativeRowOff);
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
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                this.model = {
                    nativeCol: this.map['xdr:col'].model,
                    nativeColOff: this.map['xdr:colOff'].model,
                    nativeRow: this.map['xdr:row'].model,
                    nativeRowOff: this.map['xdr:rowOff'].model,
                };
                return false;
            default:
                // not quite sure how we get here!
                return true;
        }
    }
}
exports.default = CellPositionXform;
