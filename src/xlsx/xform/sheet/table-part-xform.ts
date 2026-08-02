import BaseXform from '#src/xlsx/xform/base-xform';

class TablePartXform extends BaseXform {
  get tag() {
    return 'tablePart';
  }

  render(xmlStream: any, model: any) {
    if (model) {
      xmlStream.leafNode(this.tag, { 'r:id': model.rId });
    }
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        this.model = {
          rId: node.attributes['r:id'],
        };
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

export default TablePartXform;
