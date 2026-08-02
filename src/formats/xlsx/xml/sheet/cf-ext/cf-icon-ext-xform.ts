import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface CfIconExtModel {
  iconSet: string;
  iconId: number;
}

class CfIconExtXform extends BaseXform {
  override get tag() {
    return 'x14:cfIcon';
  }

  override render(xmlStream: XmlStream, model: CfIconExtModel) {
    xmlStream.leafNode(this.tag as string, {
      iconSet: model.iconSet,
      iconId: model.iconId,
    });
  }

  override parseOpen(node: SaxNode) {
    const attributes = node.attributes as Record<string, string>;
    this.model = {
      iconSet: attributes.iconSet,
      iconId: BaseXform.toIntValue(attributes.iconId),
    };
  }

  override parseClose(name: string) {
    return name !== this.tag;
  }
}

export default CfIconExtXform;
