import BaseXform from '#src/xlsx/xform/base-xform';
import CompositeXform from '#src/xlsx/xform/composite-xform';

import Range from '#src/doc/range';

import DatabarXform from '#src/xlsx/xform/sheet/cf/databar-xform';
import ExtLstRefXform from '#src/xlsx/xform/sheet/cf/ext-lst-ref-xform';
import FormulaXform from '#src/xlsx/xform/sheet/cf/formula-xform';
import ColorScaleXform from '#src/xlsx/xform/sheet/cf/color-scale-xform';
import IconSetXform from '#src/xlsx/xform/sheet/cf/icon-set-xform';

const extIcons = {
  '3Triangles': true,
  '3Stars': true,
  '5Boxes': true,
};

const getTextFormula = (model: any) => {
  if (model.formulae && model.formulae[0]) {
    return model.formulae[0];
  }

  const range = new Range(model.ref);
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

const getTimePeriodFormula = (model: any) => {
  if (model.formulae && model.formulae[0]) {
    return model.formulae[0];
  }

  const range = new Range(model.ref);
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

const opType = (attributes: any) => {
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

class CfRuleXform extends CompositeXform {
  databarXform: any;
  extLstRefXform: any;
  formulaXform: any;
  colorScaleXform: any;
  iconSetXform: any;

  constructor() {
    super();

    this.map = {
      dataBar: (this.databarXform = new DatabarXform()),
      extLst: (this.extLstRefXform = new ExtLstRefXform()),
      formula: (this.formulaXform = new FormulaXform()),
      colorScale: (this.colorScaleXform = new ColorScaleXform()),
      iconSet: (this.iconSetXform = new IconSetXform()),
    };
  }

  get tag() {
    return 'cfRule';
  }

  static isPrimitive(rule: any) {
    // is this rule primitive?
    if (rule.type === 'iconSet') {
      if (rule.custom || (extIcons as Record<string, any>)[rule.iconSet]) {
        return false;
      }
    }
    return true;
  }

  render(xmlStream: any, model: any) {
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

  renderExpression(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: 'expression',
      dxfId: model.dxfId,
      priority: model.priority,
    });

    this.formulaXform.render(xmlStream, model.formulae[0]);

    xmlStream.closeNode();
  }

  renderCellIs(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: 'cellIs',
      dxfId: model.dxfId,
      priority: model.priority,
      operator: model.operator,
    });

    model.formulae.forEach((formula: any) => {
      this.formulaXform.render(xmlStream, formula);
    });

    xmlStream.closeNode();
  }

  renderTop10(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      type: 'top10',
      dxfId: model.dxfId,
      priority: model.priority,
      rank: BaseXform.toIntValue(model.rank, 10),
      percent: BaseXform.toBoolAttribute(model.percent, false),
      bottom: BaseXform.toBoolAttribute(model.bottom, false),
    });
  }

  renderAboveAverage(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      type: 'aboveAverage',
      dxfId: model.dxfId,
      priority: model.priority,
      aboveAverage: BaseXform.toBoolAttribute(model.aboveAverage, true),
    });
  }

  renderDataBar(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: 'dataBar',
      priority: model.priority,
    });

    this.databarXform.render(xmlStream, model);
    this.extLstRefXform.render(xmlStream, model);

    xmlStream.closeNode();
  }

  renderColorScale(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: 'colorScale',
      priority: model.priority,
    });

    this.colorScaleXform.render(xmlStream, model);

    xmlStream.closeNode();
  }

  renderIconSet(xmlStream: any, model: any) {
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

  renderText(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: model.operator,
      dxfId: model.dxfId,
      priority: model.priority,
      operator: BaseXform.toStringAttribute(model.operator, 'containsText'),
    });

    const formula = getTextFormula(model);
    if (formula) {
      this.formulaXform.render(xmlStream, formula);
    }

    xmlStream.closeNode();
  }

  renderTimePeriod(xmlStream: any, model: any) {
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

  createNewModel({ attributes }: any) {
    return {
      ...opType(attributes),
      dxfId: BaseXform.toIntValue(attributes.dxfId),
      priority: BaseXform.toIntValue(attributes.priority),
      timePeriod: attributes.timePeriod,
      percent: BaseXform.toBoolValue(attributes.percent),
      bottom: BaseXform.toBoolValue(attributes.bottom),
      rank: BaseXform.toIntValue(attributes.rank),
      aboveAverage: BaseXform.toBoolValue(attributes.aboveAverage),
    };
  }

  onParserClose(name: any, parser: any) {
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

export default CfRuleXform;
