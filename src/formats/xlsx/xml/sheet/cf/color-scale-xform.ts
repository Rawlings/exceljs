import CompositeXform from '../../composite-xform';

import ColorXform, { type ColorModel } from '../../style/color-xform';
import CfvoXform, { type CfvoModel } from './cfvo-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface ColorScaleModel {
  cfvo: CfvoModel[];
  color: ColorModel[];
}

class ColorScaleXform extends CompositeXform {
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
    return 'colorScale';
  }

  override render(xmlStream: XmlStream, model: ColorScaleModel) {
    xmlStream.openNode(this.tag);

    model.cfvo.forEach((cfvo) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });
    model.color.forEach((color) => {
      this.colorXform.render(xmlStream, color);
    });

    xmlStream.closeNode();
  }

  override createNewModel(_node?: SaxNode): ColorScaleModel {
    return {
      cfvo: [],
      color: [],
    };
  }

  override onParserClose(name: string, parser: { model: any }) {
    this.model[name].push(parser.model);
  }
}

export default ColorScaleXform;
