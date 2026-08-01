"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const color_xform_1 = __importDefault(require("../../style/color-xform"));
const cfvo_ext_xform_1 = __importDefault(require("./cfvo-ext-xform"));
class DatabarExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x14:cfvo': (this.cfvoXform = new cfvo_ext_xform_1.default()),
            'x14:borderColor': (this.borderColorXform = new color_xform_1.default('x14:borderColor')),
            'x14:negativeBorderColor': (this.negativeBorderColorXform = new color_xform_1.default('x14:negativeBorderColor')),
            'x14:negativeFillColor': (this.negativeFillColorXform = new color_xform_1.default('x14:negativeFillColor')),
            'x14:axisColor': (this.axisColorXform = new color_xform_1.default('x14:axisColor')),
        };
    }
    static isExt(rule) {
        // not all databars need ext
        // TODO: refine this
        return !rule.gradient;
    }
    get tag() {
        return 'x14:dataBar';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            minLength: base_xform_1.default.toIntAttribute(model.minLength, 0, true),
            maxLength: base_xform_1.default.toIntAttribute(model.maxLength, 100, true),
            border: base_xform_1.default.toBoolAttribute(model.border, false),
            gradient: base_xform_1.default.toBoolAttribute(model.gradient, true),
            negativeBarColorSameAsPositive: base_xform_1.default.toBoolAttribute(model.negativeBarColorSameAsPositive, true),
            negativeBarBorderColorSameAsPositive: base_xform_1.default.toBoolAttribute(model.negativeBarBorderColorSameAsPositive, true),
            axisPosition: base_xform_1.default.toAttribute(model.axisPosition, 'auto'),
            direction: base_xform_1.default.toAttribute(model.direction, 'leftToRight'),
        });
        model.cfvo.forEach((cfvo) => {
            this.cfvoXform.render(xmlStream, cfvo);
        });
        this.borderColorXform.render(xmlStream, model.borderColor);
        this.negativeBorderColorXform.render(xmlStream, model.negativeBorderColor);
        this.negativeFillColorXform.render(xmlStream, model.negativeFillColor);
        this.axisColorXform.render(xmlStream, model.axisColor);
        xmlStream.closeNode();
    }
    createNewModel({ attributes }) {
        return {
            cfvo: [],
            minLength: base_xform_1.default.toIntValue(attributes.minLength, 0),
            maxLength: base_xform_1.default.toIntValue(attributes.maxLength, 100),
            border: base_xform_1.default.toBoolValue(attributes.border, false),
            gradient: base_xform_1.default.toBoolValue(attributes.gradient, true),
            negativeBarColorSameAsPositive: base_xform_1.default.toBoolValue(attributes.negativeBarColorSameAsPositive, true),
            negativeBarBorderColorSameAsPositive: base_xform_1.default.toBoolValue(attributes.negativeBarBorderColorSameAsPositive, true),
            axisPosition: base_xform_1.default.toStringValue(attributes.axisPosition, 'auto'),
            direction: base_xform_1.default.toStringValue(attributes.direction, 'leftToRight'),
        };
    }
    onParserClose(name, parser) {
        const [, prop] = name.split(':');
        switch (prop) {
            case 'cfvo':
                this.model.cfvo.push(parser.model);
                break;
            default:
                this.model[prop] = parser.model;
                break;
        }
    }
}
exports.default = DatabarExtXform;
