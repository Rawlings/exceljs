import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class MergeCellXform extends BaseXform {
  override get tag() {
    return 'mergeCell';
  }

  override render(xmlStream: XmlStream, model: string) {
    xmlStream.leafNode('mergeCell', { ref: model });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'mergeCell') {
      this.model = (node.attributes as Record<string, string>).ref;
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default MergeCellXform;
