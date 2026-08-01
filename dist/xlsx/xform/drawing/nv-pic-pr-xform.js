"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const c_nv_pr_xform_1 = __importDefault(require("./c-nv-pr-xform"));
const c_nv_pic_pr_xform_1 = __importDefault(require("./c-nv-pic-pr-xform"));
class NvPicPrXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'xdr:cNvPr': new c_nv_pr_xform_1.default(),
            'xdr:cNvPicPr': new c_nv_pic_pr_xform_1.default(),
        };
    }
    get tag() {
        return 'xdr:nvPicPr';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        this.map['xdr:cNvPr'].render(xmlStream, model);
        this.map['xdr:cNvPicPr'].render(xmlStream, model);
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
                this.model = this.map['xdr:cNvPr'].model;
                return false;
            default:
                return true;
        }
    }
}
exports.default = NvPicPrXform;
