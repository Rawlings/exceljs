"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const defaultnumformats_1 = __importDefault(require("../../defaultnumformats"));
const base_xform_1 = __importDefault(require("../base-xform"));
function hashDefaultFormats() {
    const hash = {};
    under_dash_1.default.each(defaultnumformats_1.default, (dnf, id) => {
        if (dnf.f) {
            hash[dnf.f] = parseInt(id, 10);
        }
        // at some point, add the other cultures here...
    });
    return hash;
}
const defaultFmtHash = hashDefaultFormats();
// NumFmt encapsulates translation between number format and xlsx
class NumFmtXform extends base_xform_1.default {
    static getDefaultFmtId;
    static getDefaultFmtCode;
    id;
    formatCode;
    constructor(id, formatCode) {
        super();
        this.id = id;
        this.formatCode = formatCode;
    }
    get tag() {
        return 'numFmt';
    }
    render(xmlStream, model) {
        xmlStream.leafNode('numFmt', { numFmtId: model.id, formatCode: model.formatCode });
    }
    parseOpen(node) {
        switch (node.name) {
            case 'numFmt':
                this.model = {
                    id: parseInt(node.attributes.numFmtId, 10),
                    formatCode: node.attributes.formatCode.replace(/[\\](.)/g, '$1'),
                };
                return true;
            default:
                return false;
        }
    }
    parseText() { }
    parseClose() {
        return false;
    }
}
NumFmtXform.getDefaultFmtId = function getDefaultFmtId(formatCode) {
    return defaultFmtHash[formatCode];
};
NumFmtXform.getDefaultFmtCode = function getDefaultFmtCode(numFmtId) {
    return defaultnumformats_1.default[numFmtId] && defaultnumformats_1.default[numFmtId].f;
};
exports.default = NumFmtXform;
