import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class DimensionXform extends BaseXform {
  override get tag() {
    return 'dimension';
  }

  override render(xmlStream: XmlStream, model: string | undefined) {
    if (model) {
      xmlStream.leafNode('dimension', { ref: model });
    }
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'dimension') {
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

export default DimensionXform;
