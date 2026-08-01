"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
const conditional_formatting_xform_1 = __importDefault(require("./conditional-formatting-xform"));
class ConditionalFormattingsXform extends base_xform_1.default {
    constructor() {
        super();
        this.cfXform = new conditional_formatting_xform_1.default();
    }
    get tag() {
        return 'conditionalFormatting';
    }
    reset() {
        this.model = [];
    }
    prepare(model, options) {
        // ensure each rule has a priority value
        let nextPriority = model.reduce((p, cf) => Math.max(p, ...cf.rules.map((rule) => rule.priority || 0)), 1);
        model.forEach((cf) => {
            cf.rules.forEach((rule) => {
                if (!rule.priority) {
                    rule.priority = nextPriority++;
                }
                if (rule.style) {
                    rule.dxfId = options.styles.addDxfStyle(rule.style);
                }
            });
        });
    }
    render(xmlStream, model) {
        model.forEach((cf) => {
            this.cfXform.render(xmlStream, cf);
        });
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'conditionalFormatting':
                this.parser = this.cfXform;
                this.parser.parseOpen(node);
                return true;
            default:
                return false;
        }
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.model.push(this.parser.model);
                this.parser = undefined;
                return false;
            }
            return true;
        }
        return false;
    }
    reconcile(model, options) {
        model.forEach((cf) => {
            cf.rules.forEach((rule) => {
                if (rule.dxfId !== undefined) {
                    rule.style = options.styles.getDxfStyle(rule.dxfId);
                    delete rule.dxfId;
                }
            });
        });
    }
}
exports.default = ConditionalFormattingsXform;
