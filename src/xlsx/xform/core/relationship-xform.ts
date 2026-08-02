import BaseXform from '#src/xlsx/xform/base-xform';

class RelationshipXform extends BaseXform {
  render(xmlStream: any, model: any) {
    xmlStream.leafNode('Relationship', model);
  }

  parseOpen(node: any) {
    switch (node.name) {
      case 'Relationship':
        this.model = node.attributes;
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

export default RelationshipXform;
