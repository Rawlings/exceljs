"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const cache_field_1 = __importDefault(require("./cache-field"));
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
class PivotCacheDefinitionXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {};
    }
    prepare(model) {
        // TK
    }
    get tag() {
        // http://www.datypic.com/sc/ooxml/e-ssml_pivotCacheDefinition.html
        return 'pivotCacheDefinition';
    }
    render(xmlStream, model) {
        const { sourceSheet, cacheFields } = model;
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode(this.tag, {
            ...PivotCacheDefinitionXform.PIVOT_CACHE_DEFINITION_ATTRIBUTES,
            'r:id': 'rId1',
            refreshOnLoad: '1', // important for our implementation to work
            refreshedBy: 'Author',
            refreshedDate: '45125.026046874998',
            createdVersion: '8',
            refreshedVersion: '8',
            minRefreshableVersion: '3',
            recordCount: cacheFields.length + 1,
        });
        xmlStream.openNode('cacheSource', { type: 'worksheet' });
        xmlStream.leafNode('worksheetSource', {
            ref: sourceSheet.dimensions.shortRange,
            sheet: sourceSheet.name,
        });
        xmlStream.closeNode();
        xmlStream.openNode('cacheFields', { count: cacheFields.length });
        // Note: keeping this pretty-printed for now to ease debugging.
        xmlStream.writeXml(cacheFields.map((cacheField) => new cache_field_1.default(cacheField).render()).join('\n    '));
        xmlStream.closeNode();
        xmlStream.closeNode();
    }
    parseOpen(node) {
        // TK
    }
    parseText(text) {
        // TK
    }
    parseClose(name) {
        // TK
    }
    reconcile(model, options) {
        // TK
    }
}
PivotCacheDefinitionXform.PIVOT_CACHE_DEFINITION_ATTRIBUTES = {
    xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'mc:Ignorable': 'xr',
    'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision',
};
exports.default = PivotCacheDefinitionXform;
