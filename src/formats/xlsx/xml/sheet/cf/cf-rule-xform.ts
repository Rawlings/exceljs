import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import Range from '../../../../../core/range';

import DatabarXform, { type DatabarModel } from './databar-xform';
import ExtLstRefXform, { type ExtModel } from './ext-lst-ref-xform';
import FormulaXform from './formula-xform';
import ColorScaleXform, { type ColorScaleModel } from './color-scale-xform';
import IconSetXform, { type IconSetModel } from './icon-set-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

const extIcons = {
  '3Triangles': true,
  '3Stars': true,
  '5Boxes': true,
};

// NB: this model shape is a loosely-typed union of all cfRule variants
// (expression/cellIs/top10/aboveAverage/dataBar/colorScale/iconSet/
// containsText/timePeriod), since a single CfRuleXform instance handles
// all of them and merges child-xform models (dataBar/colorScale/iconSet/
// extLst) directly onto `this.model` via Object.assign.
export interface CfRuleModel extends Partial<ExtModel> {
  type?: string;
  operator?: string;
  dxfId?: number;
  priority?: number;
  ref?: string;
  text?: string;
  timePeriod?: string;
  percent?: boolean;
  bottom?: boolean;
  rank?: number;
  aboveAverage?: boolean;
  formulae?: string[];
  custom?: boolean;
  // dataBar / colorScale / iconSet shapes merged onto this model when the
  // corresponding child xform closes; kept loose since their `cfvo`/`color`
  // fields collide in shape across the three variants.
  cfvo?: any[];
  color?: any;
  iconSet?: string;
  reverse?: boolean;
  showValue?: boolean;
  minLength?: number;
  maxLength?: number;
  border?: boolean;
  gradient?: boolean;
  negativeBarColorSameAsPositive?: boolean;
  negativeBarBorderColorSameAsPositive?: boolean;
  axisPosition?: string;
  direction?: string;
}

const getTextFormula = (model: CfRuleModel) => {
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

const getTimePeriodFormula = (model: CfRuleModel) => {
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

const opType = (attributes: Record<string, string>) => {
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
  databarXform: DatabarXform;
  extLstRefXform: ExtLstRefXform;
  formulaXform: FormulaXform;
  colorScaleXform: ColorScaleXform;
  iconSetXform: IconSetXform;

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

  override get tag() {
    return 'cfRule';
  }

  static isPrimitive(rule: CfRuleModel) {
    // is this rule primitive?
    if (rule.type === 'iconSet') {
      if (rule.custom || (extIcons as Record<string, any>)[rule.iconSet as string]) {
        return false;
      }
    }
    return true;
  }

  override render(xmlStream: XmlStream, model: CfRuleModel) {
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

  renderExpression(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.openNode(this.tag as string, {
      type: 'expression',
      dxfId: model.dxfId,
      priority: model.priority,
    });

    this.formulaXform.render(xmlStream, (model.formulae as string[])[0]);

    xmlStream.closeNode();
  }

  renderCellIs(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.openNode(this.tag as string, {
      type: 'cellIs',
      dxfId: model.dxfId,
      priority: model.priority,
      operator: model.operator,
    });

    (model.formulae as string[]).forEach((formula) => {
      this.formulaXform.render(xmlStream, formula);
    });

    xmlStream.closeNode();
  }

  renderTop10(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.leafNode(this.tag as string, {
      type: 'top10',
      dxfId: model.dxfId,
      priority: model.priority,
      rank: BaseXform.toIntValue(model.rank, 10),
      percent: BaseXform.toBoolAttribute(model.percent, false),
      bottom: BaseXform.toBoolAttribute(model.bottom, false),
    });
  }

  renderAboveAverage(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.leafNode(this.tag as string, {
      type: 'aboveAverage',
      dxfId: model.dxfId,
      priority: model.priority,
      aboveAverage: BaseXform.toBoolAttribute(model.aboveAverage, true),
    });
  }

  renderDataBar(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.openNode(this.tag as string, {
      type: 'dataBar',
      priority: model.priority,
    });

    this.databarXform.render(xmlStream, model as DatabarModel);
    this.extLstRefXform.render(xmlStream, model as ExtModel);

    xmlStream.closeNode();
  }

  renderColorScale(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.openNode(this.tag as string, {
      type: 'colorScale',
      priority: model.priority,
    });

    this.colorScaleXform.render(xmlStream, model as ColorScaleModel);

    xmlStream.closeNode();
  }

  renderIconSet(xmlStream: XmlStream, model: CfRuleModel) {
    // iconset is all primitive or all extLst
    if (!CfRuleXform.isPrimitive(model)) {
      return;
    }

    xmlStream.openNode(this.tag as string, {
      type: 'iconSet',
      priority: model.priority,
    });

    this.iconSetXform.render(xmlStream, model as IconSetModel);

    xmlStream.closeNode();
  }

  renderText(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.openNode(this.tag as string, {
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

  renderTimePeriod(xmlStream: XmlStream, model: CfRuleModel) {
    xmlStream.openNode(this.tag as string, {
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

  override createNewModel({ attributes }: SaxNode): CfRuleModel {
    const attrs = attributes as Record<string, string>;
    return {
      ...opType(attrs),
      dxfId: BaseXform.toIntValue(attrs.dxfId),
      priority: BaseXform.toIntValue(attrs.priority),
      timePeriod: attrs.timePeriod,
      percent: BaseXform.toBoolValue(attrs.percent),
      bottom: BaseXform.toBoolValue(attrs.bottom),
      rank: BaseXform.toIntValue(attrs.rank),
      aboveAverage: BaseXform.toBoolValue(attrs.aboveAverage),
    };
  }

  override onParserClose(name: string, parser: { model: any }) {
    const model = this.model as CfRuleModel;
    switch (name) {
      case 'dataBar':
      case 'extLst':
      case 'colorScale':
      case 'iconSet':
        // merge parser model with ours
        Object.assign(model, parser.model);
        break;

      case 'formula':
        // except - formula is a string and appends to formulae
        model.formulae = model.formulae || [];
        model.formulae.push(parser.model);
        break;
    }
  }
}

export default CfRuleXform;
