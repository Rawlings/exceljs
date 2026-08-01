import BaseXform from '../base-xform';

class VmlTextboxXform extends BaseXform {
  get tag() {
    return 'v:textbox';
  }

  conversionUnit(value: any, multiple: any, unit: any) {
    return `${parseFloat(value) * multiple.toFixed(2)}${unit}`;
  }

  reverseConversionUnit(inset: any) {
    return (inset || '').split(',').map((margin: any) => {
      return Number(parseFloat(this.conversionUnit(parseFloat(margin), 0.1, '')).toFixed(2));
    });
  }

  render(xmlStream: any, model: any) {
    const attributes: { style: string; inset?: any } = {
      style: 'mso-direction-alt:auto',
    };
    if (model && model.note) {
      let { inset } = model.note && model.note.margins;
      if (Array.isArray(inset)) {
        inset = inset
          .map((margin) => {
            return this.conversionUnit(margin, 10, 'mm');
          })
          .join(',');
      }
      if (inset) {
        attributes.inset = inset;
      }
    }
    xmlStream.openNode('v:textbox', attributes);
    xmlStream.leafNode('div', { style: 'text-align:left' });
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        this.model = {
          inset: this.reverseConversionUnit(node.attributes.inset),
        };
        return true;
      default:
        return true;
    }
  }

  parseText() {}

  parseClose(name: any) {
    switch (name) {
      case this.tag:
        return false;
      default:
        return true;
    }
  }
}

export default VmlTextboxXform;
