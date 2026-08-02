import _ from '../../../../utils/helpers/under-dash';
import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface PageMarginsModel {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  header?: number;
  footer?: number;
}

class PageMarginsXform extends BaseXform {
  override get tag() {
    return 'pageMargins';
  }

  override render(xmlStream: XmlStream, model: PageMarginsModel | undefined) {
    if (model) {
      const attributes = {
        left: model.left,
        right: model.right,
        top: model.top,
        bottom: model.bottom,
        header: model.header,
        footer: model.footer,
      };
      if (_.some(attributes, (value) => value !== undefined)) {
        xmlStream.leafNode(this.tag as string, attributes);
      }
    }
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag: {
        const attrs = node.attributes as Record<string, string>;
        this.model = {
          left: parseFloat(attrs.left || '0.7'),
          right: parseFloat(attrs.right || '0.7'),
          top: parseFloat(attrs.top || '0.75'),
          bottom: parseFloat(attrs.bottom || '0.75'),
          header: parseFloat(attrs.header || '0.3'),
          footer: parseFloat(attrs.footer || '0.3'),
        };
        return true;
      }
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default PageMarginsXform;
