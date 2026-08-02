import BaseXform from '#src/formats/xlsx/xml/base-xform';

class VmlProtectionXform extends BaseXform {
  declare _model: any;
  text: any;

  constructor(model: any) {
    super();
    this._model = model;
  }

  get tag() {
    return this._model && this._model.tag;
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, null, model);
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        this.text = '';
        return true;
      default:
        return false;
    }
  }

  parseText(text: any) {
    this.text = text;
  }

  parseClose() {
    return false;
  }
}

export default VmlProtectionXform;
