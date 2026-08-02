import utils from '../../../../utils/helpers/utils';
import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface SheetModel {
  id: number;
  name: string;
  state?: string;
  rId?: string;
}

class WorksheetXform extends BaseXform {
  override render(xmlStream: XmlStream, model: SheetModel) {
    xmlStream.leafNode('sheet', {
      sheetId: model.id,
      name: model.name,
      state: model.state,
      'r:id': model.rId,
    });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'sheet') {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        name: utils.xmlDecode(attrs.name),
        id: parseInt(attrs.sheetId, 10),
        state: attrs.state,
        rId: attrs['r:id'],
      } as SheetModel;
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default WorksheetXform;
