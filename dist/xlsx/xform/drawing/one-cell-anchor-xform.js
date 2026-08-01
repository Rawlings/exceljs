"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_cell_anchor_xform_1 = __importDefault(require("./base-cell-anchor-xform"));
const static_xform_1 = __importDefault(require("../static-xform"));
const cell_position_xform_1 = __importDefault(require("./cell-position-xform"));
const ext_xform_1 = __importDefault(require("./ext-xform"));
const pic_xform_1 = __importDefault(require("./pic-xform"));
class OneCellAnchorXform extends base_cell_anchor_xform_1.default {
    constructor() {
        super();
        this.map = {
            'xdr:from': new cell_position_xform_1.default({ tag: 'xdr:from' }),
            'xdr:ext': new ext_xform_1.default({ tag: 'xdr:ext' }),
            'xdr:pic': new pic_xform_1.default(),
            'xdr:clientData': new static_xform_1.default({ tag: 'xdr:clientData' }),
        };
    }
    get tag() {
        return 'xdr:oneCellAnchor';
    }
    prepare(model, options) {
        this.map['xdr:pic'].prepare(model.picture, options);
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, { editAs: model.range.editAs || 'oneCell' });
        this.map['xdr:from'].render(xmlStream, model.range.tl);
        this.map['xdr:ext'].render(xmlStream, model.range.ext);
        this.map['xdr:pic'].render(xmlStream, model.picture);
        this.map['xdr:clientData'].render(xmlStream, {});
        xmlStream.closeNode();
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
                this.model.range.tl = this.map['xdr:from'].model;
                this.model.range.ext = this.map['xdr:ext'].model;
                this.model.picture = this.map['xdr:pic'].model;
                return false;
            default:
                // could be some unrecognised tags
                return true;
        }
    }
    reconcile(model, options) {
        model.medium = this.reconcilePicture(model.picture, options);
    }
}
exports.default = OneCellAnchorXform;
