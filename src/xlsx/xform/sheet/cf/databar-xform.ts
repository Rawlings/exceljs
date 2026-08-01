import CompositeXform from '../../composite-xform';

import ColorXform from '../../style/color-xform';
import CfvoXform from './cfvo-xform';

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
