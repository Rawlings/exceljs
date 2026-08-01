"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const base_xform_1 = __importDefault(require("../base-xform"));
const string_xform_1 = __importDefault(require("../simple/string-xform"));
const app_heading_pairs_xform_1 = __importDefault(require("./app-heading-pairs-xform"));
const app_titles_of_parts_xform_1 = __importDefault(require("./app-titles-of-parts-xform"));
class AppXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            Company: new string_xform_1.default({ tag: 'Company' }),
            Manager: new string_xform_1.default({ tag: 'Manager' }),
            HeadingPairs: new app_heading_pairs_xform_1.default(),
            TitleOfParts: new app_titles_of_parts_xform_1.default(),
        };
    }
    render(xmlStream, model) {
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode('Properties', AppXform.PROPERTY_ATTRIBUTES);
        xmlStream.leafNode('Application', undefined, 'Microsoft Excel');
        xmlStream.leafNode('DocSecurity', undefined, '0');
        xmlStream.leafNode('ScaleCrop', undefined, 'false');
        this.map.HeadingPairs.render(xmlStream, model.worksheets);
        this.map.TitleOfParts.render(xmlStream, model.worksheets);
        this.map.Company.render(xmlStream, model.company || '');
        this.map.Manager.render(xmlStream, model.manager);
        xmlStream.leafNode('LinksUpToDate', undefined, 'false');
        xmlStream.leafNode('SharedDoc', undefined, 'false');
        xmlStream.leafNode('HyperlinksChanged', undefined, 'false');
        xmlStream.leafNode('AppVersion', undefined, '16.0300');
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'Properties':
                return true;
            default:
                this.parser = this.map[node.name];
                if (this.parser) {
                    this.parser.parseOpen(node);
                    return true;
                }
                // there's a lot we don't bother to parse
                return false;
        }
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case 'Properties':
                this.model = {
                    worksheets: this.map.TitleOfParts.model,
                    company: this.map.Company.model,
                    manager: this.map.Manager.model,
                };
                return false;
            default:
                return true;
        }
    }
}
AppXform.DateFormat = function (dt) {
    return dt.toISOString().replace(/[.]\d{3,6}/, '');
};
AppXform.DateAttrs = { 'xsi:type': 'dcterms:W3CDTF' };
AppXform.PROPERTY_ATTRIBUTES = {
    xmlns: 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties',
    'xmlns:vt': 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes',
};
exports.default = AppXform;
