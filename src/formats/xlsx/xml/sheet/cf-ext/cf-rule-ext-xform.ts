import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();
import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import DatabarExtXform, { type DatabarExtModel } from './databar-ext-xform';
import IconSetExtXform, { type IconSetExtModel } from './icon-set-ext-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

const extIcons = {
  '3Triangles': true,
  '3Stars': true,
  '5Boxes': true,
};

// NB: model is a loose union of the dataBar/iconSet ext-rule shapes; the
// databar/iconSet child-xform models get merged directly onto it via
// Object.assign in onParserClose, same pattern as CfRuleXform.
export interface CfRuleExtModel extends Partial<DatabarExtModel>, Partial<IconSetExtModel> {
  type?: string;
  x14Id?: string;
  priority?: number;
  custom?: boolean;
  iconSet?: string;
}

class CfRuleExtXform extends CompositeXform {
  databarXform: DatabarExtXform;
  iconSetXform: IconSetExtXform;

  constructor() {
    super();

    this.map = {
      'x14:dataBar': (this.databarXform = new DatabarExtXform()),
      'x14:iconSet': (this.iconSetXform = new IconSetExtXform()),
    };
  }

  override get tag() {
    return 'x14:cfRule';
  }

  static isExt(rule: CfRuleExtModel) {
    // is this rule primitive?
    if (rule.type === 'dataBar') {
      return DatabarExtXform.isExt(rule);
    }
    if (rule.type === 'iconSet') {
      if (rule.custom || (extIcons as Record<string, any>)[rule.iconSet as string]) {
        return true;
      }
    }
    return false;
  }

  override prepare(model: CfRuleExtModel, _options?: any) {
    if (CfRuleExtXform.isExt(model)) {
      model.x14Id = `{${uuidv4()}}`.toUpperCase();
    }
  }

  override render(xmlStream: XmlStream, model: CfRuleExtModel) {
    if (!CfRuleExtXform.isExt(model)) {
      return;
    }

    switch (model.type) {
      case 'dataBar':
        this.renderDataBar(xmlStream, model);
        break;
      case 'iconSet':
        this.renderIconSet(xmlStream, model);
        break;
    }
  }

  renderDataBar(xmlStream: XmlStream, model: CfRuleExtModel) {
    xmlStream.openNode(this.tag as string, {
      type: 'dataBar',
      id: model.x14Id,
    });

    this.databarXform.render(xmlStream, model as DatabarExtModel);

    xmlStream.closeNode();
  }

  renderIconSet(xmlStream: XmlStream, model: CfRuleExtModel) {
    xmlStream.openNode(this.tag as string, {
      type: 'iconSet',
      priority: model.priority,
      id: model.x14Id || `{${uuidv4()}}`,
    });

    this.iconSetXform.render(xmlStream, model as IconSetExtModel);

    xmlStream.closeNode();
  }

  override createNewModel({ attributes }: SaxNode): CfRuleExtModel {
    const attrs = attributes as Record<string, string>;
    return {
      type: attrs.type,
      x14Id: attrs.id,
      priority: BaseXform.toIntValue(attrs.priority),
    };
  }

  override onParserClose(_name: string, parser: { model: any }) {
    Object.assign(this.model, parser.model);
  }
}

export default CfRuleExtXform;
