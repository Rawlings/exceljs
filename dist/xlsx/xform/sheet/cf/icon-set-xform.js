"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const cfvo_xform_1 = __importDefault(require("./cfvo-xform"));
class IconSetXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            cfvo: (this.cfvoXform = new cfvo_xform_1.default()),
        };
    }
    get tag() {
        return 'iconSet';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            iconSet: base_xform_1.default.toStringAttribute(model.iconSet, '3TrafficLights'),
            reverse: base_xform_1.default.toBoolAttribute(model.reverse, false),
            showValue: base_xform_1.default.toBoolAttribute(model.showValue, true),
        });
        model.cfvo.forEach((cfvo) => {
            this.cfvoXform.render(xmlStream, cfvo);
        });
        xmlStream.closeNode();
    }
    createNewModel({ attributes }) {
        return {
            iconSet: base_xform_1.default.toStringValue(attributes.iconSet, '3TrafficLights'),
            reverse: base_xform_1.default.toBoolValue(attributes.reverse),
            showValue: base_xform_1.default.toBoolValue(attributes.showValue),
            cfvo: [],
        };
    }
    onParserClose(name, parser) {
        this.model[name].push(parser.model);
    }
}
exports.default = IconSetXform;
