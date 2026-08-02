import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface HLinkClickModel {
  hyperlinks?: {
    rId: string;
    tooltip?: string;
  };
}

class HLinkClickXform extends BaseXform {
  override get tag() {
    return 'a:hlinkClick';
  }

  override render(xmlStream: XmlStream, model: HLinkClickModel) {
    if (!(model.hyperlinks && model.hyperlinks.rId)) {
      return;
    }
    xmlStream.leafNode(this.tag, {
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'r:id': model.hyperlinks.rId,
      tooltip: model.hyperlinks.tooltip,
    });
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag: {
        const attrs = node.attributes as Record<string, string>;
        this.model = {
          hyperlinks: {
            rId: attrs['r:id'],
            tooltip: attrs.tooltip,
          },
        };
        return true;
      }
      default:
        return true;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default HLinkClickXform;
