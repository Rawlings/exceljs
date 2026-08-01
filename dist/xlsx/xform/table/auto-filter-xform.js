"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const filter_column_xform_1 = __importDefault(require("./filter-column-xform"));
class AutoFilterXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            filterColumn: new filter_column_xform_1.default(),
        };
    }
    get tag() {
        return 'autoFilter';
    }
    prepare(model) {
        model.columns.forEach((column, index) => {
            this.map.filterColumn.prepare(column, { index });
        });
    }
    render(xmlStream, model) {
        xmlStream.openNode(this.tag, { ref: model.autoFilterRef });
        model.columns.forEach((column) => {
            this.map.filterColumn.render(xmlStream, column);
        });
        xmlStream.closeNode();
        return true;
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case this.tag:
                this.model = {
                    autoFilterRef: node.attributes.ref,
                    columns: [],
                };
                return true;
            default:
                this.parser = this.map[node.name];
                if (this.parser) {
                    this.parseOpen(node);
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
                this.model.columns.push(this.parser.model);
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                return false;
            default:
                throw new Error(`Unexpected xml node in parseClose: ${name}`);
        }
    }
}
exports.default = AutoFilterXform;
