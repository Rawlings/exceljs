import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface TableColumnModel {
  id?: number;
  name: string;
  totalsRowLabel?: string;
  totalsRowFunction?: string;
  dxfId?: string;
  filterButton?: boolean;
  style?: unknown;
}

class TableColumnXform extends BaseXform {
  override get tag() {
    return 'tableColumn';
  }

  override prepare(model: TableColumnModel, options: { index: number }) {
    model.id = options.index + 1;
  }

  override render(xmlStream: XmlStream, model: TableColumnModel) {
    xmlStream.leafNode(this.tag as string, {
      id: (model.id as number).toString(),
      name: model.name,
      totalsRowLabel: model.totalsRowLabel,
      totalsRowFunction: model.totalsRowFunction,
      dxfId: model.dxfId,
    });
    return true;
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      const attrs = node.attributes as Record<string, string>;
      const model: TableColumnModel = { name: attrs.name };
      if (attrs.totalsRowLabel !== undefined) model.totalsRowLabel = attrs.totalsRowLabel;
      if (attrs.totalsRowFunction !== undefined) model.totalsRowFunction = attrs.totalsRowFunction;
      if (attrs.dxfId !== undefined) model.dxfId = attrs.dxfId;
      this.model = model;
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default TableColumnXform;
