import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface FilterModel {
  val: string;
}

class FilterXform extends BaseXform {
  override get tag() {
    return 'filter';
  }

  override render(xmlStream: XmlStream, model: FilterModel) {
    xmlStream.leafNode(this.tag as string, {
      val: model.val,
    });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      this.model = {
        val: (node.attributes as Record<string, string>).val,
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

export default FilterXform;
