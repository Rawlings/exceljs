"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const col_cache_1 = __importDefault(require("../../../utils/col-cache"));
const base_xform_1 = __importDefault(require("../base-xform"));
class AutoFilterXform extends base_xform_1.default {
    get tag() {
        return 'autoFilter';
    }
    render(xmlStream, model) {
        if (model) {
            if (typeof model === 'string') {
                // assume range
                xmlStream.leafNode('autoFilter', { ref: model });
            }
            else {
                const getAddress = function (addr) {
                    if (typeof addr === 'string') {
                        return addr;
                    }
                    return col_cache_1.default.getAddress(addr.row, addr.column).address;
                };
                const firstAddress = getAddress(model.from);
                const secondAddress = getAddress(model.to);
                if (firstAddress && secondAddress) {
                    xmlStream.leafNode('autoFilter', { ref: `${firstAddress}:${secondAddress}` });
                }
            }
        }
    }
    parseOpen(node) {
        if (node.name === 'autoFilter') {
            this.model = node.attributes.ref;
        }
    }
}
exports.default = AutoFilterXform;
