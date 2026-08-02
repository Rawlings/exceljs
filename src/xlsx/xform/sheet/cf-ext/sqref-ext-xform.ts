import BaseXform from '#src/xlsx/xform/base-xform';

class SqrefExtXform extends BaseXform {
  get tag() {
    return 'xm:sqref';
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

export default SqrefExtXform;
