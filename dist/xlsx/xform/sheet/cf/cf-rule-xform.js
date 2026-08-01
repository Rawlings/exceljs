"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_xform_1 = __importDefault(require("../../base-xform"));
const composite_xform_1 = __importDefault(require("../../composite-xform"));
const range_1 = __importDefault(require("../../../../doc/range"));
const databar_xform_1 = __importDefault(require("./databar-xform"));
const ext_lst_ref_xform_1 = __importDefault(require("./ext-lst-ref-xform"));
const formula_xform_1 = __importDefault(require("./formula-xform"));
const color_scale_xform_1 = __importDefault(require("./color-scale-xform"));
const icon_set_xform_1 = __importDefault(require("./icon-set-xform"));
const extIcons = {
    '3Triangles': true,
    '3Stars': true,
    '5Boxes': true,
};
const getTextFormula = (model) => {
    if (model.formulae && model.formulae[0]) {
        return model.formulae[0];
    }
    const range = new range_1.default(model.ref);
    const { tl } = range;
    switch (model.operator) {
        case 'containsText':
            return `NOT(ISERROR(SEARCH("${model.text}",${tl})))`;
        case 'containsBlanks':
            return `LEN(TRIM(${tl}))=0`;
        case 'notContainsBlanks':
            return `LEN(TRIM(${tl}))>0`;
        case 'containsErrors':
            return `ISERROR(${tl})`;
        case 'notContainsErrors':
            return `NOT(ISERROR(${tl}))`;
        default:
            return undefined;
    }
};
const getTimePeriodFormula = (model) => {
    if (model.formulae && model.formulae[0]) {
        return model.formulae[0];
    }
    const range = new range_1.default(model.ref);
    const { tl } = range;
    switch (model.timePeriod) {
        case 'thisWeek':
            return `AND(TODAY()-ROUNDDOWN(${tl},0)<=WEEKDAY(TODAY())-1,ROUNDDOWN(${tl},0)-TODAY()<=7-WEEKDAY(TODAY()))`;
        case 'lastWeek':
            return `AND(TODAY()-ROUNDDOWN(${tl},0)>=(WEEKDAY(TODAY())),TODAY()-ROUNDDOWN(${tl},0)<(WEEKDAY(TODAY())+7))`;
        case 'nextWeek':
            return `AND(ROUNDDOWN(${tl},0)-TODAY()>(7-WEEKDAY(TODAY())),ROUNDDOWN(${tl},0)-TODAY()<(15-WEEKDAY(TODAY())))`;
        case 'yesterday':
            return `FLOOR(${tl},1)=TODAY()-1`;
        case 'today':
            return `FLOOR(${tl},1)=TODAY()`;
        case 'tomorrow':
            return `FLOOR(${tl},1)=TODAY()+1`;
        case 'last7Days':
            return `AND(TODAY()-FLOOR(${tl},1)<=6,FLOOR(${tl},1)<=TODAY())`;
        case 'lastMonth':
            return `AND(MONTH(${tl})=MONTH(EDATE(TODAY(),0-1)),YEAR(${tl})=YEAR(EDATE(TODAY(),0-1)))`;
        case 'thisMonth':
            return `AND(MONTH(${tl})=MONTH(TODAY()),YEAR(${tl})=YEAR(TODAY()))`;
        case 'nextMonth':
            return `AND(MONTH(${tl})=MONTH(EDATE(TODAY(),0+1)),YEAR(${tl})=YEAR(EDATE(TODAY(),0+1)))`;
        default:
            return undefined;
    }
};
const opType = (attributes) => {
    const { type, operator } = attributes;
    switch (type) {
        case 'containsText':
        case 'containsBlanks':
        case 'notContainsBlanks':
        case 'containsErrors':
        case 'notContainsErrors':
            return {
                type: 'containsText',
                operator: type,
            };
        default:
            return { type, operator };
    }
};
class CfRuleXform extends composite_xform_1.default {
    constructor() {
        super();
        this.map = {
            dataBar: (this.databarXform = new databar_xform_1.default()),
            extLst: (this.extLstRefXform = new ext_lst_ref_xform_1.default()),
            formula: (this.formulaXform = new formula_xform_1.default()),
            colorScale: (this.colorScaleXform = new color_scale_xform_1.default()),
            iconSet: (this.iconSetXform = new icon_set_xform_1.default()),
        };
    }
    get tag() {
        return 'cfRule';
    }
    static isPrimitive(rule) {
        // is this rule primitive?
        if (rule.type === 'iconSet') {
            if (rule.custom || extIcons[rule.iconSet]) {
                return false;
            }
        }
        return true;
    }
    render(xmlStream, model) {
        switch (model.type) {
            case 'expression':
                this.renderExpression(xmlStream, model);
                break;
            case 'cellIs':
                this.renderCellIs(xmlStream, model);
                break;
            case 'top10':
                this.renderTop10(xmlStream, model);
                break;
            case 'aboveAverage':
                this.renderAboveAverage(xmlStream, model);
                break;
            case 'dataBar':
                this.renderDataBar(xmlStream, model);
                break;
            case 'colorScale':
                this.renderColorScale(xmlStream, model);
                break;
            case 'iconSet':
                this.renderIconSet(xmlStream, model);
                break;
            case 'containsText':
                this.renderText(xmlStream, model);
                break;
            case 'timePeriod':
                this.renderTimePeriod(xmlStream, model);
                break;
        }
    }
    renderExpression(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'expression',
            dxfId: model.dxfId,
            priority: model.priority,
        });
        this.formulaXform.render(xmlStream, model.formulae[0]);
        xmlStream.closeNode();
    }
    renderCellIs(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'cellIs',
            dxfId: model.dxfId,
            priority: model.priority,
            operator: model.operator,
        });
        model.formulae.forEach((formula) => {
            this.formulaXform.render(xmlStream, formula);
        });
        xmlStream.closeNode();
    }
    renderTop10(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            type: 'top10',
            dxfId: model.dxfId,
            priority: model.priority,
            percent: base_xform_1.default.toBoolAttribute(model.percent, false),
            bottom: base_xform_1.default.toBoolAttribute(model.bottom, false),
            rank: base_xform_1.default.toIntValue(model.rank, 10, true),
        });
    }
    renderAboveAverage(xmlStream, model) {
        xmlStream.leafNode(this.tag, {
            type: 'aboveAverage',
            dxfId: model.dxfId,
            priority: model.priority,
            aboveAverage: base_xform_1.default.toBoolAttribute(model.aboveAverage, true),
        });
    }
    renderDataBar(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'dataBar',
            priority: model.priority,
        });
        this.databarXform.render(xmlStream, model);
        this.extLstRefXform.render(xmlStream, model);
        xmlStream.closeNode();
    }
    renderColorScale(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'colorScale',
            priority: model.priority,
        });
        this.colorScaleXform.render(xmlStream, model);
        xmlStream.closeNode();
    }
    renderIconSet(xmlStream, model) {
        // iconset is all primitive or all extLst
        if (!CfRuleXform.isPrimitive(model)) {
            return;
        }
        xmlStream.openNode(this.tag, {
            type: 'iconSet',
            priority: model.priority,
        });
        this.iconSetXform.render(xmlStream, model);
        xmlStream.closeNode();
    }
    renderText(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: model.operator,
            dxfId: model.dxfId,
            priority: model.priority,
            operator: base_xform_1.default.toStringAttribute(model.operator, 'containsText'),
        });
        const formula = getTextFormula(model);
        if (formula) {
            this.formulaXform.render(xmlStream, formula);
        }
        xmlStream.closeNode();
    }
    renderTimePeriod(xmlStream, model) {
        xmlStream.openNode(this.tag, {
            type: 'timePeriod',
            dxfId: model.dxfId,
            priority: model.priority,
            timePeriod: model.timePeriod,
        });
        const formula = getTimePeriodFormula(model);
        if (formula) {
            this.formulaXform.render(xmlStream, formula);
        }
        xmlStream.closeNode();
    }
    createNewModel({ attributes }) {
        return {
            ...opType(attributes),
            dxfId: base_xform_1.default.toIntValue(attributes.dxfId),
            priority: base_xform_1.default.toIntValue(attributes.priority),
            timePeriod: attributes.timePeriod,
            percent: base_xform_1.default.toBoolValue(attributes.percent),
            bottom: base_xform_1.default.toBoolValue(attributes.bottom),
            rank: base_xform_1.default.toIntValue(attributes.rank),
            aboveAverage: base_xform_1.default.toBoolValue(attributes.aboveAverage),
        };
    }
    onParserClose(name, parser) {
        switch (name) {
            case 'dataBar':
            case 'extLst':
            case 'colorScale':
            case 'iconSet':
                // merge parser model with ours
                Object.assign(this.model, parser.model);
                break;
            case 'formula':
                // except - formula is a string and appends to formulae
                this.model.formulae = this.model.formulae || [];
                this.model.formulae.push(parser.model);
                break;
        }
    }
}
exports.default = CfRuleXform;
