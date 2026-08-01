"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const sqref_ext_xform_1 = __importDefault(require("./sqref-ext-xform"));
const cf_rule_ext_xform_1 = __importDefault(require("./cf-rule-ext-xform"));
class ConditionalFormattingExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'xm:sqref': (this.sqRef = new sqref_ext_xform_1.default()),
            'x14:cfRule': (this.cfRule = new cf_rule_ext_xform_1.default()),
        };
    }
    get tag() {
        return 'x14:conditionalFormatting';
    }
    prepare(model, options) {
        model.rules.forEach((rule) => {
            this.cfRule.prepare(rule, options);
        });
    }
    render(xmlStream, model) {
        if (!model.rules.some(cf_rule_ext_xform_1.default.isExt)) {
            return;
        }
        xmlStream.openNode(this.tag, {
            'xmlns:xm': 'http://schemas.microsoft.com/office/excel/2006/main',
        });
        model.rules.filter(cf_rule_ext_xform_1.default.isExt).forEach((rule) => this.cfRule.render(xmlStream, rule));
        // for some odd reason, Excel needs the <xm:sqref> node to be after the rules
        this.sqRef.render(xmlStream, model.ref);
        xmlStream.closeNode();
    }
    createNewModel() {
        return {
            rules: [],
        };
    }
    onParserClose(name, parser) {
        switch (name) {
            case 'xm:sqref':
                this.model.ref = parser.model;
                break;
            case 'x14:cfRule':
                this.model.rules.push(parser.model);
                break;
        }
    }
}
exports.default = ConditionalFormattingExtXform;
