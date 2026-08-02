import BaseXform from '#src/xlsx/xform/base-xform';

class TableColumnXform extends BaseXform {
  get tag() {
    return 'tableColumn';
  }

  prepare(model: any, options: any) {
    model.id = options.index + 1;
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      id: model.id.toString(),
      name: model.name,
      totalsRowLabel: model.totalsRowLabel,
      totalsRowFunction: model.totalsRowFunction,
      dxfId: model.dxfId,
    });
    return true;
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      const { attributes } = node;
      this.model = { name: attributes.name };
      if (attributes.totalsRowLabel !== undefined)
        this.model.totalsRowLabel = attributes.totalsRowLabel;
      if (attributes.totalsRowFunction !== undefined)
        this.model.totalsRowFunction = attributes.totalsRowFunction;
      if (attributes.dxfId !== undefined) this.model.dxfId = attributes.dxfId;
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default TableColumnXform;
