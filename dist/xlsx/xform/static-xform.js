"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("./base-xform"));
const xml_stream_1 = __importDefault(require("../../utils/xml-stream"));
// const model = {
//   tag: 'name',
//   $: {attr: 'value'},
//   c: [
//     { tag: 'child' }
//   ],
//   t: 'some text'
// };
function build(xmlStream, model) {
    xmlStream.openNode(model.tag, model.$);
    if (model.c) {
        model.c.forEach((child) => {
            build(xmlStream, child);
        });
    }
    if (model.t) {
        xmlStream.writeText(model.t);
    }
    xmlStream.closeNode();
}
class StaticXform extends base_xform_1.default {
    constructor(model) {
        super();
        // This class is an optimisation for static (unimportant and unchanging) xml
        // It is stateless - apart from its static model and so can be used as a singleton
        // Being stateless - it will only track entry to and exit from it's root xml tag during parsing and nothing else
        // Known issues:
        //    since stateless - parseOpen always returns true. Parent xform must know when to start using this xform
        //    if the root tag is recursive, the parsing will behave unpredictably
        this._model = model;
    }
    render(xmlStream) {
        if (!this._xml) {
            const stream = new xml_stream_1.default();
            build(stream, this._model);
            this._xml = stream.xml;
        }
        xmlStream.writeXml(this._xml);
    }
    parseOpen() {
        return true;
    }
    parseText() { }
    parseClose(name) {
        switch (name) {
            case this._model.tag:
                return false;
            default:
                return true;
        }
    }
}
exports.default = StaticXform;
