"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-classes-per-file */
const base_xform_1 = __importDefault(require("../../base-xform"));
const composite_xform_1 = __importDefault(require("../../composite-xform"));
class X14IdXform extends base_xform_1.default {
    get tag() {
        return 'x14:id';
    }
    render(xmlStream, model) {
        xmlStream.leafNode(this.tag, null, model);
    }
    parseOpen() {
        this.model = '';
    }
    parseText(text) {
        this.model += text;
    }
    parseClose(name) {
        return name !== this.tag;
    }
}
class ExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x14:id': (this.idXform = new X14IdXform()),
        };
    }
    get tag() {
        return 'ext';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            uri: '{B025F937-C7B1-47D3-B67F-A62EFF666E3E}',
            'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
        });
        this.idXform.render(xmlStream, model.x14Id);
        xmlStream.closeNode();
    }
    createNewModel() {
        return {};
    }
    onParserClose(name, parser) {
        this.model.x14Id = parser.model;
    }
}
class ExtLstRefXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            ext: new ExtXform(),
        };
    }
    get tag() {
        return 'extLst';
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag);
        this.map.ext.render(xmlStream, model);
        xmlStream.closeNode();
    }
    createNewModel() {
        return {};
    }
    onParserClose(name, parser) {
        Object.assign(this.model, parser.model);
    }
}
exports.default = ExtLstRefXform;
