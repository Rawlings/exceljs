"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const color_xform_1 = __importDefault(require("../style/color-xform"));
const page_setup_properties_xform_1 = __importDefault(require("./page-setup-properties-xform"));
const outline_properties_xform_1 = __importDefault(require("./outline-properties-xform"));
class SheetPropertiesXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            tabColor: new color_xform_1.default('tabColor'),
            pageSetUpPr: new page_setup_properties_xform_1.default(),
            outlinePr: new outline_properties_xform_1.default(),
        };
    }
    get tag() {
        return 'sheetPr';
    }
    render(xmlStream, model) {
        if (model) {
            xmlStream.addRollback();
            xmlStream.openNode('sheetPr');
            let inner = false;
            inner = this.map.tabColor.render(xmlStream, model.tabColor) || inner;
            inner = this.map.pageSetUpPr.render(xmlStream, model.pageSetup) || inner;
            inner = this.map.outlinePr.render(xmlStream, model.outlineProperties) || inner;
            if (inner) {
                xmlStream.closeNode();
                xmlStream.commit();
            }
            else {
                xmlStream.rollback();
            }
        }
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        if (node.name === this.tag) {
            this.reset();
            return true;
        }
        if (this.map[node.name]) {
            this.parser = this.map[node.name];
            this.parser.parseOpen(node);
            return true;
        }
        return false;
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
            return true;
        }
        return false;
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.parser = undefined;
            }
            return true;
        }
        if (this.map.tabColor.model || this.map.pageSetUpPr.model || this.map.outlinePr.model) {
            this.model = {};
            if (this.map.tabColor.model) {
                this.model.tabColor = this.map.tabColor.model;
            }
            if (this.map.pageSetUpPr.model) {
                this.model.pageSetup = this.map.pageSetUpPr.model;
            }
            if (this.map.outlinePr.model) {
                this.model.outlineProperties = this.map.outlinePr.model;
            }
        }
        else {
            this.model = null;
        }
        return false;
    }
}
exports.default = SheetPropertiesXform;
