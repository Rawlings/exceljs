import CompositeXform from '../../composite-xform';

import ColorXform, { type ColorModel } from '../../style/color-xform';
import CfvoXform, { type CfvoModel } from './cfvo-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';

export interface DatabarModel {
  cfvo: CfvoModel[];
  color?: ColorModel;
}

class DatabarXform extends CompositeXform {
  cfvoXform: CfvoXform;
  colorXform: ColorXform;

  constructor() {
    super();

    this.map = {
      cfvo: (this.cfvoXform = new CfvoXform()),
      color: (this.colorXform = new ColorXform()),
    };
  }

  override get tag() {
    return 'dataBar';
  }

  override render(xmlStream: XmlStream, model: DatabarModel) {
    xmlStream.openNode(this.tag);

    model.cfvo.forEach((cfvo) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });
    this.colorXform.render(xmlStream, model.color);

    xmlStream.closeNode();
  }

  override createNewModel(): DatabarModel {
    return {
      cfvo: [],
    };
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    switch (name) {
      case 'cfvo':
        this.model.cfvo.push(parser.model);
        break;
      case 'color':
        this.model.color = parser.model;
        break;
    }
  }
}

export default DatabarXform;
