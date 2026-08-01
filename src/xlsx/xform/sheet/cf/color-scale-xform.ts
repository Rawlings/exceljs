import CompositeXform from '../../composite-xform';

import ColorXform from '../../style/color-xform';
import CfvoXform from './cfvo-xform';

class ColorScaleXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      cfvo: (this.cfvoXform = new CfvoXform()),
      color: (this.colorXform = new ColorXform()),
    };
  }

  get tag() {
    return 'colorScale';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag);

    model.cfvo.forEach((cfvo) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });
    model.color.forEach((color) => {
      this.colorXform.render(xmlStream, color);
    });

    xmlStream.closeNode();
  }

  createNewModel(node: any) {
    return {
      cfvo: [],
      color: [],
    };
  }

  onParserClose(name: any, parser: any) {
    this.model[name].push(parser.model);
  }
}

export default ColorScaleXform;
