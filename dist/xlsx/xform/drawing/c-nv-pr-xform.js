"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const hlink_click_xform_1 = __importDefault(require("./hlink-click-xform"));
const ext_lst_xform_1 = __importDefault(require("./ext-lst-xform"));
class CNvPrXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'a:hlinkClick': new hlink_click_xform_1.default(),
            'a:extLst': new ext_lst_xform_1.default(),
        };
    }
    get tag() {
        return 'xdr:cNvPr';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            id: model.index,
            name: `Picture ${model.index}`,
        });
        this.map['a:hlinkClick'].render(xmlStream, model);
        this.map['a:extLst'].render(xmlStream, model);
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
                this.model = this.map['a:hlinkClick'].model;
                return false;
            default:
                return true;
        }
    }
}
exports.default = CNvPrXform;
