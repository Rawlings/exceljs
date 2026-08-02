import BaseXform from '#src/formats/xlsx/xml/base-xform';
import CompositeXform from '#src/formats/xlsx/xml/composite-xform';

import CfvoExtXform from '#src/formats/xlsx/xml/sheet/cf-ext/cfvo-ext-xform';
import CfIconExtXform from '#src/formats/xlsx/xml/sheet/cf-ext/cf-icon-ext-xform';

class IconSetExtXform extends CompositeXform {
  cfvoXform: any;
  cfIconXform: any;

  constructor() {
    super();

    this.map = {
      'x14:cfvo': (this.cfvoXform = new CfvoExtXform()),
      'x14:cfIcon': (this.cfIconXform = new CfIconExtXform()),
    };
  }

  get tag() {
    return 'x14:iconSet';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      iconSet: BaseXform.toStringAttribute(model.iconSet),
      reverse: BaseXform.toBoolAttribute(model.reverse, false),
      showValue: BaseXform.toBoolAttribute(model.showValue, true),
      custom: BaseXform.toBoolAttribute(model.icons, false),
    });

    model.cfvo.forEach((cfvo: any) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    if (model.icons) {
      model.icons.forEach((icon: any, i: any) => {
        icon.iconId = i;
        this.cfIconXform.render(xmlStream, icon);
      });
    }

    xmlStream.closeNode();
  }

  createNewModel({ attributes }: any) {
    return {
      cfvo: [],
      iconSet: BaseXform.toStringValue(attributes.iconSet, '3TrafficLights'),
      reverse: BaseXform.toBoolValue(attributes.reverse, false),
      showValue: BaseXform.toBoolValue(attributes.showValue, true),
    };
  }

  onParserClose(name: any, parser: any) {
    const [, prop] = name.split(':');
    switch (prop) {
      case 'cfvo':
        this.model.cfvo.push(parser.model);
        break;

      case 'cfIcon':
        if (!this.model.icons) {
          this.model.icons = [];
        }
        this.model.icons.push(parser.model);
        break;

      default:
        this.model[prop] = parser.model;
        break;
    }
  }
}

export default IconSetExtXform;
