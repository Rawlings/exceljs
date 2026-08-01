import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import CfvoXform from './cfvo-xform';

class IconSetXform extends CompositeXform {
  cfvoXform: any;

  constructor() {
    super();

    this.map = {
      cfvo: (this.cfvoXform = new CfvoXform()),
    };
  }

  get tag() {
    return 'iconSet';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      iconSet: BaseXform.toStringAttribute(model.iconSet, '3TrafficLights'),
      reverse: BaseXform.toBoolAttribute(model.reverse, false),
      showValue: BaseXform.toBoolAttribute(model.showValue, true),
    });

    model.cfvo.forEach((cfvo: any) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    xmlStream.closeNode();
  }

  createNewModel({ attributes }: any) {
    return {
      iconSet: BaseXform.toStringValue(attributes.iconSet, '3TrafficLights'),
      reverse: BaseXform.toBoolValue(attributes.reverse),
      showValue: BaseXform.toBoolValue(attributes.showValue),
      cfvo: [],
    };
  }

  onParserClose(name: any, parser: any) {
    this.model[name].push(parser.model);
  }
}

export default IconSetXform;
