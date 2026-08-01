import BaseXform from '../../base-xform';

class FormulaXform extends BaseXform {
  get tag() {
    return 'formula';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, null, model);
  }

  parseOpen() {
    this.model = '';
  }

  parseText(text: any) {
    this.model += text;
  }

  parseClose(name: any) {
    return name !== this.tag;
  }
}

export default FormulaXform;
