"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../../../utils/utils"));
const base_xform_1 = __importDefault(require("../base-xform"));
const range_1 = __importDefault(require("../../../doc/range"));
const enums_1 = __importDefault(require("../../../doc/enums"));
const rich_text_xform_1 = __importDefault(require("../strings/rich-text-xform"));
function getValueType(v) {
    if (v === null || v === undefined) {
        return enums_1.default.ValueType.Null;
    }
    if (v instanceof String || typeof v === 'string') {
        return enums_1.default.ValueType.String;
    }
    if (typeof v === 'number') {
        return enums_1.default.ValueType.Number;
    }
    if (typeof v === 'boolean') {
        return enums_1.default.ValueType.Boolean;
    }
    if (v instanceof Date) {
        return enums_1.default.ValueType.Date;
    }
    if (v.text && v.hyperlink) {
        return enums_1.default.ValueType.Hyperlink;
    }
    if (v.formula) {
        return enums_1.default.ValueType.Formula;
    }
    if (v.error) {
        return enums_1.default.ValueType.Error;
    }
    throw new Error('I could not understand type of value');
}
function getEffectiveCellType(cell) {
    switch (cell.type) {
        case enums_1.default.ValueType.Formula:
            return getValueType(cell.result);
        default:
            return cell.type;
    }
}
class CellXform extends base_xform_1.default {
    constructor() {
        super();
        this.richTextXForm = new rich_text_xform_1.default();
    }
    get tag() {
        return 'c';
    }
    prepare(model, options) {
        const styleId = options.styles.addStyleModel(model.style || {}, getEffectiveCellType(model));
        if (styleId) {
            model.styleId = styleId;
        }
        if (model.comment) {
            options.comments.push({ ...model.comment, ref: model.address });
        }
        switch (model.type) {
            case enums_1.default.ValueType.String:
            case enums_1.default.ValueType.RichText:
                if (options.sharedStrings) {
                    model.ssId = options.sharedStrings.add(model.value);
                }
                break;
            case enums_1.default.ValueType.Date:
                if (options.date1904) {
                    model.date1904 = true;
                }
                break;
            case enums_1.default.ValueType.Hyperlink:
                if (options.sharedStrings && model.text !== undefined && model.text !== null) {
                    model.ssId = options.sharedStrings.add(model.text);
                }
                options.hyperlinks.push({
                    address: model.address,
                    target: model.hyperlink,
                    tooltip: model.tooltip,
                });
                break;
            case enums_1.default.ValueType.Merge:
                options.merges.add(model);
                break;
            case enums_1.default.ValueType.Formula:
                if (options.date1904) {
                    // in case valueType is date
                    model.date1904 = true;
                }
                if (model.shareType === 'shared') {
                    model.si = options.siFormulae++;
                }
                if (model.formula) {
                    options.formulae[model.address] = model;
                }
                else if (model.sharedFormula) {
                    const master = options.formulae[model.sharedFormula];
                    if (!master) {
                        throw new Error(`Shared Formula master must exist above and or left of clone for cell ${model.address}`);
                    }
                    if (master.si === undefined) {
                        master.shareType = 'shared';
                        master.si = options.siFormulae++;
                        master.range = new range_1.default(master.address, model.address);
                    }
                    else if (master.range) {
                        master.range.expandToAddress(model.address);
                    }
                    model.si = master.si;
                }
                break;
            default:
                break;
        }
    }
    renderFormula(xmlStream, model) {
        let attrs = null;
        switch (model.shareType) {
            case 'shared':
                attrs = {
                    t: 'shared',
                    ref: model.ref || model.range.range,
                    si: model.si,
                };
                break;
            case 'array':
                attrs = {
                    t: 'array',
                    ref: model.ref,
                };
                break;
            default:
                if (model.si !== undefined) {
                    attrs = {
                        t: 'shared',
                        si: model.si,
                    };
                }
                break;
        }
        switch (getValueType(model.result)) {
            case enums_1.default.ValueType.Null: // ?
                xmlStream.leafNode('f', attrs, model.formula);
                break;
            case enums_1.default.ValueType.String:
                // oddly, formula results don't ever use shared strings
                xmlStream.addAttribute('t', 'str');
                xmlStream.leafNode('f', attrs, model.formula);
                xmlStream.leafNode('v', null, model.result);
                break;
            case enums_1.default.ValueType.Number:
                xmlStream.leafNode('f', attrs, model.formula);
                xmlStream.leafNode('v', null, model.result);
                break;
            case enums_1.default.ValueType.Boolean:
                xmlStream.addAttribute('t', 'b');
                xmlStream.leafNode('f', attrs, model.formula);
                xmlStream.leafNode('v', null, model.result ? 1 : 0);
                break;
            case enums_1.default.ValueType.Error:
                xmlStream.addAttribute('t', 'e');
                xmlStream.leafNode('f', attrs, model.formula);
                xmlStream.leafNode('v', null, model.result.error);
                break;
            case enums_1.default.ValueType.Date:
                xmlStream.leafNode('f', attrs, model.formula);
                xmlStream.leafNode('v', null, utils_1.default.dateToExcel(model.result, model.date1904));
                break;
            // case Enums.ValueType.Hyperlink: // ??
            // case Enums.ValueType.Formula:
            default:
                throw new Error('I could not understand type of value');
        }
    }
    render(xmlStream, model) {
        if (model.type === enums_1.default.ValueType.Null && !model.styleId) {
            // if null and no style, exit
            return;
        }
        xmlStream.openNode('c');
        xmlStream.addAttribute('r', model.address);
        if (model.styleId) {
            xmlStream.addAttribute('s', model.styleId);
        }
        switch (model.type) {
            case enums_1.default.ValueType.Null:
                break;
            case enums_1.default.ValueType.Number:
                xmlStream.leafNode('v', null, model.value);
                break;
            case enums_1.default.ValueType.Boolean:
                xmlStream.addAttribute('t', 'b');
                xmlStream.leafNode('v', null, model.value ? '1' : '0');
                break;
            case enums_1.default.ValueType.Error:
                xmlStream.addAttribute('t', 'e');
                xmlStream.leafNode('v', null, model.value.error);
                break;
            case enums_1.default.ValueType.String:
            case enums_1.default.ValueType.RichText:
                if (model.ssId !== undefined) {
                    xmlStream.addAttribute('t', 's');
                    xmlStream.leafNode('v', null, model.ssId);
                }
                else if (model.value && model.value.richText) {
                    xmlStream.addAttribute('t', 'inlineStr');
                    xmlStream.openNode('is');
                    model.value.richText.forEach((text) => {
                        this.richTextXForm.render(xmlStream, text);
                    });
                    xmlStream.closeNode('is');
                }
                else {
                    xmlStream.addAttribute('t', 'str');
                    xmlStream.leafNode('v', null, model.value);
                }
                break;
            case enums_1.default.ValueType.Date:
                xmlStream.leafNode('v', null, utils_1.default.dateToExcel(model.value, model.date1904));
                break;
            case enums_1.default.ValueType.Hyperlink:
                if (model.ssId !== undefined) {
                    xmlStream.addAttribute('t', 's');
                    xmlStream.leafNode('v', null, model.ssId);
                }
                else {
                    xmlStream.addAttribute('t', 'str');
                    xmlStream.leafNode('v', null, model.text);
                }
                break;
            case enums_1.default.ValueType.Formula:
                this.renderFormula(xmlStream, model);
                break;
            case enums_1.default.ValueType.Merge:
                // nothing to add
                break;
            default:
                break;
        }
        xmlStream.closeNode(); // </c>
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'c':
                // const address = colCache.decodeAddress(node.attributes.r);
                this.model = {
                    address: node.attributes.r,
                };
                this.t = node.attributes.t;
                if (node.attributes.s) {
                    this.model.styleId = parseInt(node.attributes.s, 10);
                }
                return true;
            case 'f':
                this.currentNode = 'f';
                this.model.si = node.attributes.si;
                this.model.shareType = node.attributes.t;
                this.model.ref = node.attributes.ref;
                return true;
            case 'v':
                this.currentNode = 'v';
                return true;
            case 't':
                this.currentNode = 't';
                return true;
            case 'r':
                this.parser = this.richTextXForm;
                this.parser.parseOpen(node);
                return true;
            default:
                return false;
        }
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
            return;
        }
        switch (this.currentNode) {
            case 'f':
                this.model.formula = this.model.formula ? this.model.formula + text : text;
                break;
            case 'v':
            case 't':
                if (this.model.value && this.model.value.richText) {
                    this.model.value.richText.text = this.model.value.richText.text
                        ? this.model.value.richText.text + text
                        : text;
                }
                else {
                    this.model.value = this.model.value ? this.model.value + text : text;
                }
                break;
            default:
                break;
        }
    }
    parseClose(name) {
        switch (name) {
            case 'c': {
                const { model } = this;
                // first guess on cell type
                if (model.formula || model.shareType) {
                    model.type = enums_1.default.ValueType.Formula;
                    if (model.value) {
                        if (this.t === 'str') {
                            model.result = utils_1.default.xmlDecode(model.value);
                        }
                        else if (this.t === 'b') {
                            model.result = parseInt(model.value, 10) !== 0;
                        }
                        else if (this.t === 'e') {
                            model.result = { error: model.value };
                        }
                        else {
                            model.result = parseFloat(model.value);
                        }
                        model.value = undefined;
                    }
                }
                else if (model.value !== undefined) {
                    switch (this.t) {
                        case 's':
                            model.type = enums_1.default.ValueType.String;
                            model.value = parseInt(model.value, 10);
                            break;
                        case 'str':
                            model.type = enums_1.default.ValueType.String;
                            model.value = utils_1.default.xmlDecode(model.value);
                            break;
                        case 'inlineStr':
                            model.type = enums_1.default.ValueType.String;
                            break;
                        case 'b':
                            model.type = enums_1.default.ValueType.Boolean;
                            model.value = parseInt(model.value, 10) !== 0;
                            break;
                        case 'e':
                            model.type = enums_1.default.ValueType.Error;
                            model.value = { error: model.value };
                            break;
                        default:
                            model.type = enums_1.default.ValueType.Number;
                            model.value = parseFloat(model.value);
                            break;
                    }
                }
                else if (model.styleId) {
                    model.type = enums_1.default.ValueType.Null;
                }
                else {
                    model.type = enums_1.default.ValueType.Merge;
                }
                return false;
            }
            case 'f':
            case 'v':
            case 'is':
                this.currentNode = undefined;
                return true;
            case 't':
                if (this.parser) {
                    this.parser.parseClose(name);
                    return true;
                }
                this.currentNode = undefined;
                return true;
            case 'r':
                this.model.value = this.model.value || {};
                this.model.value.richText = this.model.value.richText || [];
                this.model.value.richText.push(this.parser.model);
                this.parser = undefined;
                this.currentNode = undefined;
                return true;
            default:
                if (this.parser) {
                    this.parser.parseClose(name);
                    return true;
                }
                return false;
        }
    }
    reconcile(model, options) {
        const style = model.styleId && options.styles && options.styles.getStyleModel(model.styleId);
        if (style) {
            model.style = style;
        }
        if (model.styleId !== undefined) {
            model.styleId = undefined;
        }
        switch (model.type) {
            case enums_1.default.ValueType.String:
                if (typeof model.value === 'number') {
                    if (options.sharedStrings) {
                        model.value = options.sharedStrings.getString(model.value);
                    }
                }
                if (model.value.richText) {
                    model.type = enums_1.default.ValueType.RichText;
                }
                break;
            case enums_1.default.ValueType.Number:
                if (style && utils_1.default.isDateFmt(style.numFmt)) {
                    model.type = enums_1.default.ValueType.Date;
                    model.value = utils_1.default.excelToDate(model.value, options.date1904);
                }
                break;
            case enums_1.default.ValueType.Formula:
                if (model.result !== undefined && style && utils_1.default.isDateFmt(style.numFmt)) {
                    model.result = utils_1.default.excelToDate(model.result, options.date1904);
                }
                if (model.shareType === 'shared') {
                    if (model.ref) {
                        // master
                        options.formulae[model.si] = model.address;
                    }
                    else {
                        // slave
                        model.sharedFormula = options.formulae[model.si];
                        delete model.shareType;
                    }
                    delete model.si;
                }
                break;
            default:
                break;
        }
        // look for hyperlink
        const hyperlink = options.hyperlinkMap[model.address];
        if (hyperlink) {
            if (model.type === enums_1.default.ValueType.Formula) {
                model.text = model.result;
                model.result = undefined;
            }
            else {
                model.text = model.value;
                model.value = undefined;
            }
            model.type = enums_1.default.ValueType.Hyperlink;
            model.hyperlink = hyperlink;
        }
        const comment = options.commentsMap && options.commentsMap[model.address];
        if (comment) {
            model.comment = comment;
        }
    }
}
exports.default = CellXform;
