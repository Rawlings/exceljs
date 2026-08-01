"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const uuidv4 = () => crypto_1.default.randomUUID();
const base_xform_1 = __importDefault(require("../../base-xform"));
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const databar_ext_xform_1 = __importDefault(require("./databar-ext-xform"));
const icon_set_ext_xform_1 = __importDefault(require("./icon-set-ext-xform"));
const extIcons = {
    '3Triangles': true,
    '3Stars': true,
    '5Boxes': true,
};
class CfRuleExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x14:dataBar': (this.databarXform = new databar_ext_xform_1.default()),
            'x14:iconSet': (this.iconSetXform = new icon_set_ext_xform_1.default()),
        };
    }
    get tag() {
        return 'x14:cfRule';
    }
    static isExt(rule) {
        // is this rule primitive?
        if (rule.type === 'dataBar') {
            return databar_ext_xform_1.default.isExt(rule);
        }
        if (rule.type === 'iconSet') {
            if (rule.custom || extIcons[rule.iconSet]) {
                return true;
            }
        }
        return false;
    }
    prepare(model) {
        if (CfRuleExtXform.isExt(model)) {
            model.x14Id = `{${uuidv4()}}`.toUpperCase();
        }
    }
    render(xmlStream, model) {
        if (!CfRuleExtXform.isExt(model)) {
            return;
        }
        switch (model.type) {
            case 'dataBar':
                this.renderDataBar(xmlStream, model);
                break;
            case 'iconSet':
                this.renderIconSet(xmlStream, model);
                break;
        }
    }
    renderDataBar(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'dataBar',
            id: model.x14Id,
        });
        this.databarXform.render(xmlStream, model);
        xmlStream.closeNode();
    }
    renderIconSet(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'iconSet',
            priority: model.priority,
            id: model.x14Id || `{${uuidv4()}}`,
        });
        this.iconSetXform.render(xmlStream, model);
        xmlStream.closeNode();
    }
    createNewModel({ attributes }) {
        return {
            type: attributes.type,
            x14Id: attributes.id,
            priority: base_xform_1.default.toIntValue(attributes.priority),
        };
    }
    onParserClose(name, parser) {
        Object.assign(this.model, parser.model);
    }
}
exports.default = CfRuleExtXform;
