import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface ColorModel {
  argb?: string;
  theme?: number;
  tint?: number;
  indexed?: number;
}

// Color encapsulates translation from color model to/from xlsx
class ColorXform extends BaseXform {
  name: string;

  constructor(name?: string) {
    super();

    // this.name controls the xm node name
    this.name = name || 'color';
  }

  override get tag() {
    return this.name;
  }

  override render(xmlStream: XmlStream, model: ColorModel | undefined): boolean {
    if (model) {
      xmlStream.openNode(this.name);
      if (model.argb) {
        xmlStream.addAttribute('rgb', model.argb);
      } else if (model.theme !== undefined) {
        xmlStream.addAttribute('theme', model.theme);
        if (model.tint !== undefined) {
          xmlStream.addAttribute('tint', model.tint);
        }
      } else if (model.indexed !== undefined) {
        xmlStream.addAttribute('indexed', model.indexed);
      } else {
        xmlStream.addAttribute('auto', '1');
      }
      xmlStream.closeNode();
      return true;
    }
    return false;
  }

  override parseOpen(node: SaxNode): boolean {
    if (node.name === this.name) {
      const attrs = node.attributes as Record<string, string>;
      if (attrs.rgb) {
        this.model = { argb: attrs.rgb };
      } else if (attrs.theme) {
        const model: ColorModel = { theme: parseInt(attrs.theme, 10) };
        if (attrs.tint) {
          model.tint = parseFloat(attrs.tint);
        }
        this.model = model;
      } else if (attrs.indexed) {
        this.model = { indexed: parseInt(attrs.indexed, 10) };
      } else {
        this.model = undefined;
      }
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default ColorXform;
