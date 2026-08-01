"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const color_xform_1 = __importDefault(require("../../style/color-xform"));
const cfvo_xform_1 = __importDefault(require("./cfvo-xform"));
class DatabarXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            cfvo: (this.cfvoXform = new cfvo_xform_1.default()),
            color: (this.colorXform = new color_xform_1.default()),
        };
    }
    get tag() {
        return 'dataBar';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        model.cfvo.forEach((cfvo) => {
            this.cfvoXform.render(xmlStream, cfvo);
        });
        this.colorXform.render(xmlStream, model.color);
        xmlStream.closeNode();
    }
    createNewModel() {
        return {
            cfvo: [],
        };
    }
    onParserClose(name, parser) {
        switch (name) {
            case 'cfvo':
                this.model.cfvo.push(parser.model);
                break;
            case 'color':
                this.model.color = parser.model;
                break;
        }
    }
}
exports.default = DatabarXform;
