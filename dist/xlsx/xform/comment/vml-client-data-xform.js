"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const vml_anchor_xform_1 = __importDefault(require("./vml-anchor-xform"));
const vml_protection_xform_1 = __importDefault(require("./style/vml-protection-xform"));
const vml_position_xform_1 = __importDefault(require("./style/vml-position-xform"));
const POSITION_TYPE = ['twoCells', 'oneCells', 'absolute'];
class VmlClientDataXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x:Anchor': new vml_anchor_xform_1.default(),
            'x:Locked': new vml_protection_xform_1.default({ tag: 'x:Locked' }),
            'x:LockText': new vml_protection_xform_1.default({ tag: 'x:LockText' }),
            'x:SizeWithCells': new vml_position_xform_1.default({ tag: 'x:SizeWithCells' }),
            'x:MoveWithCells': new vml_position_xform_1.default({ tag: 'x:MoveWithCells' }),
        };
    }
    get tag() {
        return 'x:ClientData';
    }
    render(xmlStream, model) {
        const { protection, editAs } = model.note;
        xmlStream.openNode(this.tag, { ObjectType: 'Note' });
        this.map['x:MoveWithCells'].render(xmlStream, editAs, POSITION_TYPE);
        this.map['x:SizeWithCells'].render(xmlStream, editAs, POSITION_TYPE);
        this.map['x:Anchor'].render(xmlStream, model);
        this.map['x:Locked'].render(xmlStream, protection.locked);
        xmlStream.leafNode('x:AutoFill', null, 'False');
        this.map['x:LockText'].render(xmlStream, protection.lockText);
        xmlStream.leafNode('x:Row', null, model.refAddress.row - 1);
        xmlStream.leafNode('x:Column', null, model.refAddress.col - 1);
        xmlStream.closeNode();
    }
    parseOpen(node) {
        switch (node.name) {
            case this.tag:
                this.reset();
                this.model = {
                    anchor: [],
                    protection: {},
                    editAs: '',
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
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                this.normalizeModel();
                return false;
            default:
                return true;
        }
    }
    normalizeModel() {
        const position = Object.assign({}, this.map['x:MoveWithCells'].model, this.map['x:SizeWithCells'].model);
        const len = Object.keys(position).length;
        this.model.editAs = POSITION_TYPE[len];
        this.model.anchor = this.map['x:Anchor'].text;
        this.model.protection.locked = this.map['x:Locked'].text;
        this.model.protection.lockText = this.map['x:LockText'].text;
    }
}
exports.default = VmlClientDataXform;
