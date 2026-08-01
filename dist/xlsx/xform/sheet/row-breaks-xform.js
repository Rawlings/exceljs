'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const page_breaks_xform_1 = __importDefault(require("./page-breaks-xform"));
const list_xform_1 = __importDefault(require("../list-xform"));
class RowBreaksXform extends list_xform_1.default {
    constructor() {
        const options = {
            tag: 'rowBreaks',
            count: true,
            childXform: new page_breaks_xform_1.default(),
        };
        super(options);
    }
    // get tag() { return 'rowBreaks'; }
    render(xmlStream, model) {
        if (model && model.length) {
            xmlStream.openNode(this.tag, this.$);
            if (this.count) {
                xmlStream.addAttribute(this.$count, model.length);
                xmlStream.addAttribute('manualBreakCount', model.length);
            }
            const { childXform } = this;
            model.forEach((childModel) => {
                childXform.render(xmlStream, childModel);
            });
            xmlStream.closeNode();
        }
        else if (this.empty) {
            xmlStream.leafNode(this.tag);
        }
    }
}
exports.default = RowBreaksXform;
