'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const color_xform_1 = __importDefault(require("./color-xform"));
const boolean_xform_1 = __importDefault(require("../simple/boolean-xform"));
const integer_xform_1 = __importDefault(require("../simple/integer-xform"));
const string_xform_1 = __importDefault(require("../simple/string-xform"));
const underline_xform_1 = __importDefault(require("./underline-xform"));
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const base_xform_1 = __importDefault(require("../base-xform"));
// Font encapsulates translation from font model to xlsx
class FontXform extends base_xform_1.default {
    constructor(options) {
        super();
        this.options = options || FontXform.OPTIONS;
        this.map = {
            b: { prop: 'bold', xform: new boolean_xform_1.default({ tag: 'b', attr: 'val' }) },
            i: { prop: 'italic', xform: new boolean_xform_1.default({ tag: 'i', attr: 'val' }) },
            u: { prop: 'underline', xform: new underline_xform_1.default() },
            charset: { prop: 'charset', xform: new integer_xform_1.default({ tag: 'charset', attr: 'val' }) },
            color: { prop: 'color', xform: new color_xform_1.default() },
            condense: { prop: 'condense', xform: new boolean_xform_1.default({ tag: 'condense', attr: 'val' }) },
            extend: { prop: 'extend', xform: new boolean_xform_1.default({ tag: 'extend', attr: 'val' }) },
            family: { prop: 'family', xform: new integer_xform_1.default({ tag: 'family', attr: 'val' }) },
            outline: { prop: 'outline', xform: new boolean_xform_1.default({ tag: 'outline', attr: 'val' }) },
            vertAlign: { prop: 'vertAlign', xform: new string_xform_1.default({ tag: 'vertAlign', attr: 'val' }) },
            scheme: { prop: 'scheme', xform: new string_xform_1.default({ tag: 'scheme', attr: 'val' }) },
            shadow: { prop: 'shadow', xform: new boolean_xform_1.default({ tag: 'shadow', attr: 'val' }) },
            strike: { prop: 'strike', xform: new boolean_xform_1.default({ tag: 'strike', attr: 'val' }) },
            sz: { prop: 'size', xform: new integer_xform_1.default({ tag: 'sz', attr: 'val' }) },
        };
        this.map[this.options.fontNameTag] = {
            prop: 'name',
            xform: new string_xform_1.default({ tag: this.options.fontNameTag, attr: 'val' }),
        };
    }
    get tag() {
        return this.options.tagName;
    }
    render(xmlStream, model) {
        const { map } = this;
        xmlStream.openNode(this.options.tagName);
        under_dash_1.default.each(this.map, (defn, tag) => {
            map[tag].xform.render(xmlStream, model[defn.prop]);
        });
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        if (this.map[node.name]) {
            this.parser = this.map[node.name].xform;
            return this.parser.parseOpen(node);
        }
        switch (node.name) {
            case this.options.tagName:
                this.model = {};
                return true;
            default:
                return false;
        }
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser && !this.parser.parseClose(name)) {
            const item = this.map[name];
            if (this.parser.model) {
                this.model[item.prop] = this.parser.model;
            }
            this.parser = undefined;
            return true;
        }
        switch (name) {
            case this.options.tagName:
                return false;
            default:
                return true;
        }
    }
}
FontXform.OPTIONS = {
    tagName: 'font',
    fontNameTag: 'name',
};
exports.default = FontXform;
