import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class PageBreaksXform extends BaseXform {
  override get tag() {
    return 'brk';
  }

  override render(xmlStream: XmlStream, model: Record<string, unknown>) {
    xmlStream.leafNode('brk', model);
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'brk') {
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

export default PageBreaksXform;
