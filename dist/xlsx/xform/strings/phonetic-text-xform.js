"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_xform_1 = __importDefault(require("./text-xform"));
const rich_text_xform_1 = __importDefault(require("./rich-text-xform"));
const base_xform_1 = __importDefault(require("../base-xform"));
// <rPh sb="0" eb="1">
//   <t>(its pronounciation in KATAKANA)</t>
// </rPh>
class PhoneticTextXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            r: new rich_text_xform_1.default(),
            t: new text_xform_1.default(),
        };
    }
    get tag() {
        return 'rPh';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            sb: model.sb || 0,
            eb: model.eb || 0,
        });
        if (model && model.hasOwnProperty('richText') && model.richText) {
            const { r } = this.map;
            model.richText.forEach((text) => {
                r.render(xmlStream, text);
            });
        }
        else if (model) {
            this.map.t.render(xmlStream, model.text);
        }
        xmlStream.closeNode();
    }
    parseOpen(node) {
        const { name } = node;
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        if (name === this.tag) {
            this.model = {
                sb: parseInt(node.attributes.sb, 10),
                eb: parseInt(node.attributes.eb, 10),
            };
            return true;
        }
        this.parser = this.map[name];
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        return false;
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                switch (name) {
                    case 'r': {
                        let rt = this.model.richText;
                        if (!rt) {
                            rt = this.model.richText = [];
                        }
                        rt.push(this.parser.model);
                        break;
                    }
                    case 't':
                        this.model.text = this.parser.model;
                        break;
                    default:
                        break;
                }
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                return false;
            default:
                return true;
        }
    }
}
exports.default = PhoneticTextXform;
