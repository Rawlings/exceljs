"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const cf_rule_xform_1 = __importDefault(require("./cf-rule-xform"));
class ConditionalFormattingXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            cfRule: new cf_rule_xform_1.default(),
        };
    }
    get tag() {
        return 'conditionalFormatting';
    }
    render(xmlStream, model) {
        // if there are no primitive rules, exit now
        if (!model.rules.some(cf_rule_xform_1.default.isPrimitive)) {
            return;
        }
        xmlStream.openNode(this.tag, { sqref: model.ref });
        model.rules.forEach((rule) => {
            if (cf_rule_xform_1.default.isPrimitive(rule)) {
                rule.ref = model.ref;
                this.map.cfRule.render(xmlStream, rule);
            }
        });
        xmlStream.closeNode();
    }
    createNewModel({ attributes }) {
        return {
            ref: attributes.sqref,
            rules: [],
        };
    }
    onParserClose(name, parser) {
        this.model.rules.push(parser.model);
    }
}
exports.default = ConditionalFormattingXform;
