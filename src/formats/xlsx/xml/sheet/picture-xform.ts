import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface PictureModel {
  rId: string;
}

class PictureXform extends BaseXform {
  override get tag() {
    return 'picture';
  }

  override render(xmlStream: XmlStream, model: PictureModel | undefined) {
    if (model) {
      xmlStream.leafNode(this.tag as string, { 'r:id': model.rId });
    }
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag:
        this.model = {
          rId: (node.attributes as Record<string, string>)['r:id'],
        };
        return true;
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default PictureXform;
