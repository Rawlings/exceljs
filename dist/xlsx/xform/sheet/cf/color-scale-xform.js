"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const color_xform_1 = __importDefault(require("../../style/color-xform"));
const cfvo_xform_1 = __importDefault(require("./cfvo-xform"));
class ColorScaleXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            cfvo: (this.cfvoXform = new cfvo_xform_1.default()),
            color: (this.colorXform = new color_xform_1.default()),
        };
    }
    get tag() {
        return 'colorScale';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        model.cfvo.forEach((cfvo) => {
            this.cfvoXform.render(xmlStream, cfvo);
        });
        model.color.forEach((color) => {
            this.colorXform.render(xmlStream, color);
        });
        xmlStream.closeNode();
    }
    createNewModel(node) {
        return {
            cfvo: [],
            color: [],
        };
    }
    onParserClose(name, parser) {
        this.model[name].push(parser.model);
    }
}
exports.default = ColorScaleXform;
