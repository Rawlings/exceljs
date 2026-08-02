import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

class CNvPicPrXform extends BaseXform {
  override get tag() {
    return 'xdr:cNvPicPr';
  }

  override render(xmlStream: XmlStream) {
    xmlStream.openNode(this.tag as string);
    xmlStream.leafNode('a:picLocks', {
      noChangeAspect: '1',
    });
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag:
        return true;
      default:
        return true;
    }
  }

  override parseText() {}

  override parseClose(name?: string) {
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
