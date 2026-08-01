"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const blip_xform_1 = __importDefault(require("./blip-xform"));
class BlipFillXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'a:blip': new blip_xform_1.default(),
        };
    }
    get tag() {
        return 'xdr:blipFill';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        this.map['a:blip'].render(xmlStream, model);
        // TODO: options for this + parsing
        xmlStream.openNode('a:stretch');
        xmlStream.leafNode('a:fillRect');
        xmlStream.closeNode();
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
    parseText() { }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                this.model = this.map['a:blip'].model;
                return false;
            default:
                return true;
        }
    }
}
exports.default = BlipFillXform;
