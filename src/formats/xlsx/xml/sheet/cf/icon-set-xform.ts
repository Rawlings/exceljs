import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import CfvoXform, { type CfvoModel } from './cfvo-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface IconSetModel {
  iconSet?: string;
  reverse?: boolean;
  showValue?: boolean;
  cfvo: CfvoModel[];
}

class IconSetXform extends CompositeXform {
  cfvoXform: CfvoXform;

  constructor() {
    super();

    this.map = {
      cfvo: (this.cfvoXform = new CfvoXform()),
    };
  }

  override get tag() {
    return 'iconSet';
  }

  override render(xmlStream: XmlStream, model: IconSetModel) {
    xmlStream.openNode(this.tag, {
      iconSet: BaseXform.toStringAttribute(model.iconSet, '3TrafficLights'),
      reverse: BaseXform.toBoolAttribute(model.reverse, false),
      showValue: BaseXform.toBoolAttribute(model.showValue, true),
    });

    model.cfvo.forEach((cfvo) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    xmlStream.closeNode();
  }

  override createNewModel({ attributes }: SaxNode): IconSetModel {
    const attrs = attributes as Record<string, string>;
    return {
      iconSet: BaseXform.toStringValue(attrs.iconSet, '3TrafficLights') as string,
      reverse: BaseXform.toBoolValue(attrs.reverse),
      showValue: BaseXform.toBoolValue(attrs.showValue),
      cfvo: [],
    };
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    this.model[name].push(parser.model);
  }
}

export default IconSetXform;
