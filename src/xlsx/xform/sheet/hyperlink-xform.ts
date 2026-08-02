import BaseXform from '#src/xlsx/xform/base-xform';

class HyperlinkXform extends BaseXform {
  get tag() {
    return 'hyperlink';
  }

  render(xmlStream: any, model: any) {
    if (this.isInternalLink(model)) {
      xmlStream.leafNode('hyperlink', {
        ref: model.address,
        'r:id': model.rId,
        tooltip: model.tooltip,
        location: model.target,
      });
    } else {
      xmlStream.leafNode('hyperlink', {
        ref: model.address,
        'r:id': model.rId,
        tooltip: model.tooltip,
      });
    }
  }

  parseOpen(node: any) {
    if (node.name === 'hyperlink') {
      this.model = {
        address: node.attributes.ref,
        rId: node.attributes['r:id'],
        tooltip: node.attributes.tooltip,
      };

      // This is an internal link
      if (node.attributes.location) {
        this.model.target = node.attributes.location;
      }
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }

  isInternalLink(model: any) {
    // @example: Sheet2!D3, return true
    return model.target && /^[^!]+![a-zA-Z]+[\d]+$/.test(model.target);
  }
}

export default HyperlinkXform;
