import BaseXform from '../../base-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface CfvoModel {
  type: string;
  value: number;
}

class CfvoXform extends BaseXform {
  override get tag() {
    return 'cfvo';
  }

  override render(xmlStream: XmlStream, model: CfvoModel) {
    xmlStream.leafNode(this.tag as string, {
      type: model.type,
      val: model.value,
    });
  }

  override parseOpen(node: SaxNode) {
    const attrs = node.attributes as Record<string, string>;
    this.model = {
      type: attrs.type,
      value: BaseXform.toFloatValue(attrs.val),
    };
  }

  override parseClose(name: string) {
    return name !== this.tag;
  }
}

export default CfvoXform;
