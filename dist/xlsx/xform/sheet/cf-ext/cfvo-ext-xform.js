"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const f_ext_xform_1 = __importDefault(require("./f-ext-xform"));
class CfvoExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'xm:f': (this.fExtXform = new f_ext_xform_1.default()),
        };
    }
    get tag() {
        return 'x14:cfvo';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: model.type,
        });
        if (model.value !== undefined) {
            this.fExtXform.render(xmlStream, model.value);
        }
        xmlStream.closeNode();
    }
    createNewModel(node) {
        return {
            type: node.attributes.type,
        };
    }
    onParserClose(name, parser) {
        switch (name) {
            case 'xm:f':
                this.model.value = parser.model ? parseFloat(parser.model) : 0;
                break;
        }
    }
}
exports.default = CfvoExtXform;
