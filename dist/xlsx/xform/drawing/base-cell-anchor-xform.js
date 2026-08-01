"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
class BaseCellAnchorXform extends base_xform_1.default {
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case this.tag:
                this.reset();
                this.model = {
                    range: {
                        editAs: node.attributes.editAs || 'oneCell',
                    },
                };
                break;
            default:
                this.parser = this.map[node.name];
                if (this.parser) {
                    this.parser.parseOpen(node);
                }
                break;
        }
        return true;
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    reconcilePicture(model, options) {
        if (model && model.rId) {
            const rel = options.rels[model.rId];
            const match = rel.Target.match(/.*\/media\/(.+[.][a-zA-Z]{3,4})/);
            if (match) {
                const name = match[1];
                const mediaId = options.mediaIndex[name];
                return options.media[mediaId];
            }
        }
        return undefined;
    }
}
exports.default = BaseCellAnchorXform;
