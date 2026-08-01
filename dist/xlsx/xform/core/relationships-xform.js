"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const base_xform_1 = __importDefault(require("../base-xform"));
const relationship_xform_1 = __importDefault(require("./relationship-xform"));
class RelationshipsXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            Relationship: new relationship_xform_1.default(),
        };
    }
    render(xmlStream, model) {
        model = model || this._values;
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode('Relationships', RelationshipsXform.RELATIONSHIPS_ATTRIBUTES);
        model.forEach((relationship) => {
            this.map.Relationship.render(xmlStream, relationship);
        });
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'Relationships':
                this.model = [];
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
                this.model.push(this.parser.model);
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case 'Relationships':
                return false;
            default:
                throw new Error(`Unexpected xml node in parseClose: ${name}`);
        }
    }
}
RelationshipsXform.RELATIONSHIPS_ATTRIBUTES = {
    xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships',
};
exports.default = RelationshipsXform;
