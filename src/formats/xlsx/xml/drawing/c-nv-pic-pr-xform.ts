import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class CNvPicPrXform extends BaseXform {
  override get tag() {
    return 'xdr:cNvPicPr';
  }

  override render(xmlStream: XmlStream) {
    xmlStream.openNode(this.tag);
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
