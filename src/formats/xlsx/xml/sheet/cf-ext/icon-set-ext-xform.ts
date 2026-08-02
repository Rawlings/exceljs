import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import CfvoExtXform, { type CfvoExtModel } from './cfvo-ext-xform';
import CfIconExtXform, { type CfIconExtModel } from './cf-icon-ext-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface IconSetExtModel {
  cfvo: CfvoExtModel[];
  iconSet?: string;
  reverse?: boolean;
  showValue?: boolean;
  icons?: CfIconExtModel[];
}

class IconSetExtXform extends CompositeXform {
  cfvoXform: CfvoExtXform;
  cfIconXform: CfIconExtXform;

  constructor() {
    super();

    this.map = {
      'x14:cfvo': (this.cfvoXform = new CfvoExtXform()),
      'x14:cfIcon': (this.cfIconXform = new CfIconExtXform()),
    };
  }

  override get tag() {
    return 'x14:iconSet';
  }

  override render(xmlStream: XmlStream, model: IconSetExtModel) {
    xmlStream.openNode(this.tag, {
      iconSet: BaseXform.toStringAttribute(model.iconSet),
      reverse: BaseXform.toBoolAttribute(model.reverse, false),
      showValue: BaseXform.toBoolAttribute(model.showValue, true),
      custom: BaseXform.toBoolAttribute(model.icons, false),
    });

    model.cfvo.forEach((cfvo) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    if (model.icons) {
      model.icons.forEach((icon, i) => {
        icon.iconId = i;
        this.cfIconXform.render(xmlStream, icon);
      });
    }

    xmlStream.closeNode();
  }

  override createNewModel({ attributes }: SaxNode): IconSetExtModel {
    const attrs = attributes as Record<string, string>;
    return {
      cfvo: [],
      iconSet: BaseXform.toStringValue(attrs.iconSet, '3TrafficLights') as string,
      reverse: BaseXform.toBoolValue(attrs.reverse, false),
      showValue: BaseXform.toBoolValue(attrs.showValue, true),
    };
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    const [, prop] = name.split(':');
    const model = this.model;
    switch (prop) {
      case 'cfvo':
        model.cfvo.push(parser.model as CfvoExtModel);
        break;

      case 'cfIcon':
        if (!model.icons) {
          model.icons = [];
        }
        model.icons.push(parser.model as CfIconExtModel);
        break;

      default:
        model[prop] = parser.model;
        break;
    }
  }
}

export default IconSetExtXform;
