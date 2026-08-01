import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();
import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import DatabarExtXform from './databar-ext-xform';
import IconSetExtXform from './icon-set-ext-xform';

const extIcons = {
  '3Triangles': true,
  '3Stars': true,
  '5Boxes': true,
};

class CfRuleExtXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      'x14:dataBar': (this.databarXform = new DatabarExtXform()),
      'x14:iconSet': (this.iconSetXform = new IconSetExtXform()),
    };
  }

  get tag() {
    return 'x14:cfRule';
  }

  static isExt(rule: any) {
    // is this rule primitive?
    if (rule.type === 'dataBar') {
      return DatabarExtXform.isExt(rule);
    }
    if (rule.type === 'iconSet') {
      if (rule.custom || extIcons[rule.iconSet]) {
        return true;
      }
    }
    return false;
  }

  prepare(model: any) {
    if (CfRuleExtXform.isExt(model)) {
      model.x14Id = `{${uuidv4()}}`.toUpperCase();
    }
  }

  render(xmlStream: any, model: any) {
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

  renderDataBar(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: 'dataBar',
      id: model.x14Id,
    });

    this.databarXform.render(xmlStream, model);

    xmlStream.closeNode();
  }

  renderIconSet(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: 'iconSet',
      priority: model.priority,
      id: model.x14Id || `{${uuidv4()}}`,
    });

    this.iconSetXform.render(xmlStream, model);

    xmlStream.closeNode();
  }

  createNewModel({ attributes }: any) {
    return {
      type: attributes.type,
      x14Id: attributes.id,
      priority: BaseXform.toIntValue(attributes.priority),
    };
  }

  onParserClose(name: any, parser: any) {
    Object.assign(this.model, parser.model);
  }
}

export default CfRuleExtXform;
