import CompositeXform from '../../composite-xform';

import FExtXform from './f-ext-xform';

class CfvoExtXform extends CompositeXform {
  fExtXform: any;

  constructor() {
    super();

    this.map = {
      'xm:f': (this.fExtXform = new FExtXform()),
    };
  }

  get tag() {
    return 'x14:cfvo';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      type: model.type,
    });
    if (model.value !== undefined) {
      this.fExtXform.render(xmlStream, model.value);
    }
    xmlStream.closeNode();
  }

  createNewModel(node: any) {
    return {
      type: node.attributes.type,
    };
  }

  onParserClose(name: any, parser: any) {
    switch (name) {
      case 'xm:f':
        this.model.value = parser.model ? parseFloat(parser.model) : 0;
        break;
    }
  }
}

export default CfvoExtXform;
