import BaseXform from '../../base-xform';

class VmlPositionXform extends BaseXform {
  declare _model: any;

  constructor(model: any) {
    super();
    this._model = model;
  }

  get tag() {
    return this._model && this._model.tag;
  }

  render(xmlStream: any, model: any, type: any) {
    if (model === type[2]) {
      xmlStream.leafNode(this.tag);
    } else if (this.tag === 'x:SizeWithCells' && model === type[1]) {
      xmlStream.leafNode(this.tag);
    }
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        this.model = {};
        this.model[this.tag] = true;
        return true;
      default:
        return false;
    }
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default VmlPositionXform;
