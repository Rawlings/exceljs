import BaseXform from '#src/xlsx/xform/base-xform';

class FExtXform extends BaseXform {
  get tag() {
    return 'xm:f';
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

export default FExtXform;
