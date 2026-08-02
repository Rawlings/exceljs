import BaseXform from '#src/xlsx/xform/base-xform';

class BooleanXform extends BaseXform {
  _tag: any;
  attr: any;

  override get tag(): any {
    return this._tag;
  }

  override set tag(val: any) {
    this._tag = val;
  }

  constructor(options?: any) {
    super();
    options = options || {};

    this.tag = options.tag;
    this.attr = options.attr;
  }

  render(xmlStream: any, model: any) {
    if (model) {
      xmlStream.openNode(this.tag);
      xmlStream.closeNode();
    }
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      this.model = true;
    }
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default BooleanXform;
