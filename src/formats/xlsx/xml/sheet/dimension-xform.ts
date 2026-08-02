import BaseXform from '#src/formats/xlsx/xml/base-xform';

class DimensionXform extends BaseXform {
  get tag() {
    return 'dimension';
  }

  render(xmlStream: any, model: any) {
    if (model) {
      xmlStream.leafNode('dimension', { ref: model });
    }
  }

  parseOpen(node: any) {
    if (node.name === 'dimension') {
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

export default DimensionXform;
