"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const cf_rule_ext_xform_1 = __importDefault(require("./cf-rule-ext-xform"));
const conditional_formatting_ext_xform_1 = __importDefault(require("./conditional-formatting-ext-xform"));
class ConditionalFormattingsExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x14:conditionalFormatting': (this.cfXform = new conditional_formatting_ext_xform_1.default()),
        };
    }
    get tag() {
        return 'x14:conditionalFormattings';
    }
    hasContent(model) {
        if (model.hasExtContent === undefined) {
            model.hasExtContent = model.some((cf) => cf.rules.some(cf_rule_ext_xform_1.default.isExt));
        }
        return model.hasExtContent;
    }
    prepare(model, options) {
        model.forEach((cf) => {
            this.cfXform.prepare(cf, options);
        });
    }
    render(xmlStream, model) {
        if (this.hasContent(model)) {
            xmlStream.openNode(this.tag);
            model.forEach((cf) => this.cfXform.render(xmlStream, cf));
            xmlStream.closeNode();
        }
    }
    createNewModel() {
        return [];
    }
    onParserClose(name, parser) {
        // model is array of conditional formatting objects
        this.model.push(parser.model);
    }
}
exports.default = ConditionalFormattingsExtXform;
