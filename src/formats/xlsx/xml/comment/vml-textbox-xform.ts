import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class VmlTextboxXform extends BaseXform {
  override get tag() {
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

  override render(xmlStream: XmlStream, model: any) {
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

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case this.tag:
        this.model = {
          inset: this.reverseConversionUnit((node.attributes as Record<string, string>).inset),
        };
        return true;
      default:
        return true;
    }
  }

  override parseText() {}

  override parseClose(name: string): boolean {
    switch (name) {
      case this.tag:
        return false;
      default:
        return true;
    }
  }
}

export default VmlTextboxXform;
