"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const cfvo_ext_xform_1 = __importDefault(require("./cfvo-ext-xform"));
const cf_icon_ext_xform_1 = __importDefault(require("./cf-icon-ext-xform"));
class IconSetExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x14:cfvo': (this.cfvoXform = new cfvo_ext_xform_1.default()),
            'x14:cfIcon': (this.cfIconXform = new cf_icon_ext_xform_1.default()),
        };
    }
    get tag() {
        return 'x14:iconSet';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            iconSet: base_xform_1.default.toStringAttribute(model.iconSet),
            reverse: base_xform_1.default.toBoolAttribute(model.reverse, false),
            showValue: base_xform_1.default.toBoolAttribute(model.showValue, true),
            custom: base_xform_1.default.toBoolAttribute(model.icons, false),
        });
        model.cfvo.forEach((cfvo) => {
            this.cfvoXform.render(xmlStream, cfvo);
        });
        if (model.icons) {
            model.icons.forEach((icon, i) => {
                icon.iconId = i;
                this.cfIconXform.render(xmlStream, icon);
            });
        }
        xmlStream.closeNode();
    }
    createNewModel({ attributes }) {
        return {
            cfvo: [],
            iconSet: base_xform_1.default.toStringValue(attributes.iconSet, '3TrafficLights'),
            reverse: base_xform_1.default.toBoolValue(attributes.reverse, false),
            showValue: base_xform_1.default.toBoolValue(attributes.showValue, true),
        };
    }
    onParserClose(name, parser) {
        const [, prop] = name.split(':');
        switch (prop) {
            case 'cfvo':
                this.model.cfvo.push(parser.model);
                break;
            case 'cfIcon':
                if (!this.model.icons) {
                    this.model.icons = [];
                }
                this.model.icons.push(parser.model);
                break;
            default:
                this.model[prop] = parser.model;
                break;
        }
    }
}
exports.default = IconSetExtXform;
