import BaseXform from '#src/xlsx/xform/base-xform';

class MergeCellXform extends BaseXform {
  get tag() {
    return 'mergeCell';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode('mergeCell', { ref: model });
  }

  parseOpen(node: any) {
    if (node.name === 'mergeCell') {
      this.model = node.attributes.ref;
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default MergeCellXform;
