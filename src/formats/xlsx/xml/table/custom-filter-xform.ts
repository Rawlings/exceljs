import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface CustomFilterModel {
  val: string;
  operator: string;
}

class CustomFilterXform extends BaseXform {
  override get tag() {
    return 'customFilter';
  }

  override render(xmlStream: XmlStream, model: CustomFilterModel) {
    xmlStream.leafNode(this.tag as string, {
      operator: model.operator,
      val: model.val,
    });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        val: attrs.val,
        operator: attrs.operator,
      };
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default CustomFilterXform;
