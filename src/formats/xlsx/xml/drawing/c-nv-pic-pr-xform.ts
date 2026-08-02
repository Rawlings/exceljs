import BaseXform from '#src/formats/xlsx/xml/base-xform';

class CNvPicPrXform extends BaseXform {
  get tag() {
    return 'xdr:cNvPicPr';
  }

  render(xmlStream: any) {
    xmlStream.openNode(this.tag);
    xmlStream.leafNode('a:picLocks', {
      noChangeAspect: '1',
    });
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        return true;
      default:
        return true;
    }
  }

  parseText() {}

  parseClose(name: any) {
    switch (name) {
      case this.tag:
        return false;
      default:
        // unprocessed internal nodes
        return true;
    }
  }
}

export default CNvPicPrXform;
