"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_xform_1 = __importDefault(require("./text-xform"));
const rich_text_xform_1 = __importDefault(require("./rich-text-xform"));
const phonetic_text_xform_1 = __importDefault(require("./phonetic-text-xform"));
const base_xform_1 = __importDefault(require("../base-xform"));
// <si>
//   <r></r><r></r>...
// </si>
// <si>
//   <t></t>
// </si>
class SharedStringXform extends base_xform_1.default {
    constructor(model) {
        super();
        this.model = model;
        this.map = {
            r: new rich_text_xform_1.default(),
            t: new text_xform_1.default(),
            rPh: new phonetic_text_xform_1.default(),
        };
    }
    get tag() {
        return 'si';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        if (model && model.hasOwnProperty('richText') && model.richText) {
            if (model.richText.length) {
                model.richText.forEach((text) => {
                    this.map.r.render(xmlStream, text);
                });
            }
            else {
                this.map.t.render(xmlStream, '');
            }
        }
        else if (model !== undefined && model !== null) {
            this.map.t.render(xmlStream, model);
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
            this.model = {};
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
                        this.model = this.parser.model;
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
exports.default = SharedStringXform;
