"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const base_xform_1 = __importDefault(require("../base-xform"));
const date_xform_1 = __importDefault(require("../simple/date-xform"));
const string_xform_1 = __importDefault(require("../simple/string-xform"));
const integer_xform_1 = __importDefault(require("../simple/integer-xform"));
class CoreXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            'dc:creator': new string_xform_1.default({ tag: 'dc:creator' }),
            'dc:title': new string_xform_1.default({ tag: 'dc:title' }),
            'dc:subject': new string_xform_1.default({ tag: 'dc:subject' }),
            'dc:description': new string_xform_1.default({ tag: 'dc:description' }),
            'dc:identifier': new string_xform_1.default({ tag: 'dc:identifier' }),
            'dc:language': new string_xform_1.default({ tag: 'dc:language' }),
            'cp:keywords': new string_xform_1.default({ tag: 'cp:keywords' }),
            'cp:category': new string_xform_1.default({ tag: 'cp:category' }),
            'cp:lastModifiedBy': new string_xform_1.default({ tag: 'cp:lastModifiedBy' }),
            'cp:lastPrinted': new date_xform_1.default({ tag: 'cp:lastPrinted', format: CoreXform.DateFormat }),
            'cp:revision': new integer_xform_1.default({ tag: 'cp:revision' }),
            'cp:version': new string_xform_1.default({ tag: 'cp:version' }),
            'cp:contentStatus': new string_xform_1.default({ tag: 'cp:contentStatus' }),
            'cp:contentType': new string_xform_1.default({ tag: 'cp:contentType' }),
            'dcterms:created': new date_xform_1.default({
                tag: 'dcterms:created',
                attrs: CoreXform.DateAttrs,
                format: CoreXform.DateFormat,
            }),
            'dcterms:modified': new date_xform_1.default({
                tag: 'dcterms:modified',
                attrs: CoreXform.DateAttrs,
                format: CoreXform.DateFormat,
            }),
        };
    }
    render(xmlStream, model) {
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode('cp:coreProperties', CoreXform.CORE_PROPERTY_ATTRIBUTES);
        this.map['dc:creator'].render(xmlStream, model.creator);
        this.map['dc:title'].render(xmlStream, model.title);
        this.map['dc:subject'].render(xmlStream, model.subject);
        this.map['dc:description'].render(xmlStream, model.description);
        this.map['dc:identifier'].render(xmlStream, model.identifier);
        this.map['dc:language'].render(xmlStream, model.language);
        this.map['cp:keywords'].render(xmlStream, model.keywords);
        this.map['cp:category'].render(xmlStream, model.category);
        this.map['cp:lastModifiedBy'].render(xmlStream, model.lastModifiedBy);
        this.map['cp:lastPrinted'].render(xmlStream, model.lastPrinted);
        this.map['cp:revision'].render(xmlStream, model.revision);
        this.map['cp:version'].render(xmlStream, model.version);
        this.map['cp:contentStatus'].render(xmlStream, model.contentStatus);
        this.map['cp:contentType'].render(xmlStream, model.contentType);
        this.map['dcterms:created'].render(xmlStream, model.created);
        this.map['dcterms:modified'].render(xmlStream, model.modified);
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'cp:coreProperties':
            case 'coreProperties':
                return true;
            default:
                this.parser = this.map[node.name];
                if (this.parser) {
                    this.parser.parseOpen(node);
                    return true;
                }
                throw new Error(`Unexpected xml node in parseOpen: ${JSON.stringify(node)}`);
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
            case 'cp:coreProperties':
            case 'coreProperties':
                this.model = {
                    creator: this.map['dc:creator'].model,
                    title: this.map['dc:title'].model,
                    subject: this.map['dc:subject'].model,
                    description: this.map['dc:description'].model,
                    identifier: this.map['dc:identifier'].model,
                    language: this.map['dc:language'].model,
                    keywords: this.map['cp:keywords'].model,
                    category: this.map['cp:category'].model,
                    lastModifiedBy: this.map['cp:lastModifiedBy'].model,
                    lastPrinted: this.map['cp:lastPrinted'].model,
                    revision: this.map['cp:revision'].model,
                    contentStatus: this.map['cp:contentStatus'].model,
                    contentType: this.map['cp:contentType'].model,
                    created: this.map['dcterms:created'].model,
                    modified: this.map['dcterms:modified'].model,
                };
                return false;
            default:
                throw new Error(`Unexpected xml node in parseClose: ${name}`);
        }
    }
}
CoreXform.DateFormat = function (dt) {
    return dt.toISOString().replace(/[.]\d{3}/, '');
};
CoreXform.DateAttrs = { 'xsi:type': 'dcterms:W3CDTF' };
CoreXform.CORE_PROPERTY_ATTRIBUTES = {
    'xmlns:cp': 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
    'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    'xmlns:dcterms': 'http://purl.org/dc/terms/',
    'xmlns:dcmitype': 'http://purl.org/dc/dcmitype/',
    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
};
exports.default = CoreXform;
