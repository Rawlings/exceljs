"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const static_xform_1 = __importDefault(require("../static-xform"));
const blip_fill_xform_1 = __importDefault(require("./blip-fill-xform"));
const nv_pic_pr_xform_1 = __importDefault(require("./nv-pic-pr-xform"));
const sp_pr_1 = __importDefault(require("./sp-pr"));
class PicXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'xdr:nvPicPr': new nv_pic_pr_xform_1.default(),
            'xdr:blipFill': new blip_fill_xform_1.default(),
            'xdr:spPr': new static_xform_1.default(sp_pr_1.default),
        };
    }
    get tag() {
        return 'xdr:pic';
    }
    prepare(model, options) {
        model.index = options.index + 1;
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        this.map['xdr:nvPicPr'].render(xmlStream, model);
        this.map['xdr:blipFill'].render(xmlStream, model);
        this.map['xdr:spPr'].render(xmlStream, model);
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
                this.mergeModel(this.parser.model);
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                return false;
            default:
                // not quite sure how we get here!
                return true;
        }
    }
}
exports.default = PicXform;
