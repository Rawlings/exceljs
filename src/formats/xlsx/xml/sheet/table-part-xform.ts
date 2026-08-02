import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface TablePartModel {
  rId: string;
}

class TablePartXform extends BaseXform {
  override get tag() {
    return 'tablePart';
  }

  override render(xmlStream: XmlStream, model: TablePartModel | undefined) {
    if (model) {
      xmlStream.leafNode(this.tag, { 'r:id': model.rId });
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

export default TablePartXform;
