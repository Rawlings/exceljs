"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-classes-per-file */
const composite_xform_1 = __importDefault(require("../composite-xform"));
const conditional_formattings_ext_xform_1 = __importDefault(require("./cf-ext/conditional-formattings-ext-xform"));
class ExtXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            'x14:conditionalFormattings': (this.conditionalFormattings = new conditional_formattings_ext_xform_1.default()),
        };
    }
    get tag() {
        return 'ext';
    }
    hasContent(model) {
        return this.conditionalFormattings.hasContent(model.conditionalFormattings);
    }
    prepare(model, options) {
        this.conditionalFormattings.prepare(model.conditionalFormattings, options);
    }
    render(xmlStream, model) {
        xmlStream.openNode('ext', {
            uri: '{78C0D931-6437-407d-A8EE-F0AAD7539E65}',
            'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
        });
        this.conditionalFormattings.render(xmlStream, model.conditionalFormattings);
        xmlStream.closeNode();
    }
    createNewModel() {
        return {};
    }
    onParserClose(name, parser) {
        this.model[name] = parser.model;
    }
}
class ExtLstXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            ext: (this.ext = new ExtXform()),
        };
    }
    get tag() {
        return 'extLst';
    }
    prepare(model, options) {
        this.ext.prepare(model, options);
    }
    hasContent(model) {
        return this.ext.hasContent(model);
    }
    render(xmlStream, model) {
        if (!this.hasContent(model)) {
            return;
        }
        xmlStream.openNode('extLst');
        this.ext.render(xmlStream, model);
        xmlStream.closeNode();
    }
    createNewModel() {
        return {};
    }
    onParserClose(name, parser) {
        Object.assign(this.model, parser.model);
    }
}
exports.default = ExtLstXform;
