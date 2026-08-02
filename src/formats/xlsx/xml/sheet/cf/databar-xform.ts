import CompositeXform from '#src/formats/xlsx/xml/composite-xform';

import ColorXform from '#src/formats/xlsx/xml/style/color-xform';
import CfvoXform from '#src/formats/xlsx/xml/sheet/cf/cfvo-xform';

class DatabarXform extends CompositeXform {
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
    return 'dataBar';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag);

    model.cfvo.forEach((cfvo: any) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });
    this.colorXform.render(xmlStream, model.color);

    xmlStream.closeNode();
  }

  createNewModel() {
    return {
      cfvo: [],
    };
  }

  onParserClose(name: any, parser: any) {
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
