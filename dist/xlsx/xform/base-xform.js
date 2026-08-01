"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_sax_1 = __importDefault(require("../../utils/parse-sax"));
const xml_stream_1 = __importDefault(require("../../utils/xml-stream"));
/* 'virtual' methods used as a form of documentation */
/* eslint-disable class-methods-use-this */
// Base class for Xforms
class BaseXform {
    model;
    map;
    parser;
    get tag() {
        return undefined;
    }
    // ============================================================
    // Virtual Interface
    prepare(_model, _options) {
        // optional preparation (mutation) of model so it is ready for write
    }
    render(_xmlStream, _model) {
        // convert model to xml
    }
    parseOpen(_node) {
        // XML node opened
    }
    parseText(_text) {
        // chunk of text encountered for current node
    }
    parseClose(_name) {
        // XML node closed
    }
    reconcile(_model, _options) {
        // optional post-parse step (opposite to prepare)
    }
    // ============================================================
    reset() {
        // to make sure parses don't bleed to next iteration
        this.model = null;
        // if we have a map - reset them too
        if (this.map) {
            Object.values(this.map).forEach((xform) => {
                if (xform instanceof BaseXform) {
                    xform.reset();
                }
                else if (xform && xform.xform) {
                    xform.xform.reset();
                }
            });
        }
    }
    mergeModel(obj) {
        // set obj's props to this.model
        this.model = Object.assign(this.model || {}, obj);
    }
    async parse(saxParser) {
        for await (const events of saxParser) {
            for (const { eventType, value } of events) {
                if (eventType === 'opentag') {
                    this.parseOpen(value);
                }
                else if (eventType === 'text') {
                    this.parseText(value);
                }
                else if (eventType === 'closetag') {
                    if (!this.parseClose(value.name)) {
                        return this.model;
                    }
                }
            }
        }
        return this.model;
    }
    async parseStream(stream) {
        return this.parse((0, parse_sax_1.default)(stream));
    }
    get xml() {
        // convenience function to get the xml of this.model
        // useful for manager types that are built during the prepare phase
        return this.toXml(this.model);
    }
    toXml(model) {
        const xmlStream = new xml_stream_1.default();
        this.render(xmlStream, model);
        return xmlStream.xml;
    }
    // ============================================================
    // Useful Utilities
    static toAttribute(value, dflt, always = false) {
        if (value === undefined) {
            if (always) {
                return dflt;
            }
        }
        else if (always || value !== dflt) {
            return value.toString();
        }
        return undefined;
    }
    static toStringAttribute(value, dflt, always = false) {
        return BaseXform.toAttribute(value, dflt, always);
    }
    static toStringValue(attr, dflt) {
        return attr === undefined ? dflt : attr;
    }
    static toBoolAttribute(value, dflt, always = false) {
        if (value === undefined) {
            if (always) {
                return dflt;
            }
        }
        else if (always || value !== dflt) {
            return value ? '1' : '0';
        }
        return undefined;
    }
    static toBoolValue(attr, dflt) {
        return attr === undefined ? dflt : attr === '1';
    }
    static toIntAttribute(value, dflt, always = false) {
        return BaseXform.toAttribute(value, dflt, always);
    }
    static toIntValue(attr, dflt) {
        return attr === undefined ? dflt : parseInt(attr, 10);
    }
    static toFloatAttribute(value, dflt, always = false) {
        return BaseXform.toAttribute(value, dflt, always);
    }
    static toFloatValue(attr, dflt) {
        return attr === undefined ? dflt : parseFloat(attr);
    }
}
exports.default = BaseXform;
