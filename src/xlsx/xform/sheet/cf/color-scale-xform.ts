import CompositeXform from '#src/xlsx/xform/composite-xform';

import ColorXform from '#src/xlsx/xform/style/color-xform';
import CfvoXform from '#src/xlsx/xform/sheet/cf/cfvo-xform';

class ColorScaleXform extends CompositeXform {
  cfvoXform: any;
  colorXform: any;

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

    model.cfvo.forEach((cfvo: any) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });
    model.color.forEach((color: any) => {
      this.colorXform.render(xmlStream, color);
    });

    xmlStream.closeNode();
  }

  createNewModel(_node?: any) {
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
