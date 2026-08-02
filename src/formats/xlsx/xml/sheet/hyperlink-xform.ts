import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface HyperlinkModel {
  address?: string;
  rId?: string;
  tooltip?: string;
  target?: string;
}

class HyperlinkXform extends BaseXform {
  override get tag() {
    return 'hyperlink';
  }

  override render(xmlStream: XmlStream, model: HyperlinkModel) {
    if (this.isInternalLink(model)) {
      xmlStream.leafNode('hyperlink', {
        ref: model.address,
        'r:id': model.rId,
        tooltip: model.tooltip,
        location: model.target,
      });
    } else {
      xmlStream.leafNode('hyperlink', {
        ref: model.address,
        'r:id': model.rId,
        tooltip: model.tooltip,
      });
    }
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'hyperlink') {
      const attrs = node.attributes as Record<string, string>;
      const model: HyperlinkModel = {
        address: attrs.ref,
        rId: attrs['r:id'],
        tooltip: attrs.tooltip,
      };

      // This is an internal link
      if (attrs.location) {
        model.target = attrs.location;
      }
      this.model = model;
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }

  isInternalLink(model: HyperlinkModel): boolean {
    // @example: Sheet2!D3, return true
    return !!(model.target && /^[^!]+![a-zA-Z]+[\d]+$/.test(model.target));
  }
}

export default HyperlinkXform;
