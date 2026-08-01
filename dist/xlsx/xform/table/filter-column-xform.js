"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../base-xform"));
const list_xform_1 = __importDefault(require("../list-xform"));
const custom_filter_xform_1 = __importDefault(require("./custom-filter-xform"));
const filter_xform_1 = __importDefault(require("./filter-xform"));
class FilterColumnXform extends base_xform_1.default {
    constructor() {
        super();
        this.map = {
            customFilters: new list_xform_1.default({
                tag: 'customFilters',
                count: false,
                empty: true,
                childXform: new custom_filter_xform_1.default(),
            }),
            filters: new list_xform_1.default({
                tag: 'filters',
                count: false,
                empty: true,
                childXform: new filter_xform_1.default(),
            }),
        };
    }
    get tag() {
        return 'filterColumn';
    }
    prepare(model, options) {
        model.colId = options.index.toString();
    }
    render(xmlStream, model) {
        if (model.customFilters) {
            xmlStream.openNode(this.tag, {
                colId: model.colId,
                hiddenButton: model.filterButton ? '0' : '1',
            });
            this.map.customFilters.render(xmlStream, model.customFilters);
            xmlStream.closeNode();
            return true;
        }
        xmlStream.leafNode(this.tag, {
            colId: model.colId,
            hiddenButton: model.filterButton ? '0' : '1',
        });
        return true;
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        const { attributes } = node;
        switch (node.name) {
            case this.tag:
                this.model = {
                    filterButton: attributes.hiddenButton === '0',
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
    parseText() { }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case this.tag:
                this.model.customFilters = this.map.customFilters.model;
                return false;
            default:
                // could be some unrecognised tags
                return true;
        }
    }
}
exports.default = FilterColumnXform;
