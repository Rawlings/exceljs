import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

/** https://en.wikipedia.org/wiki/Office_Open_XML_file_formats#DrawingML */
const EMU_PER_PIXEL_AT_96_DPI = 9525;

export interface ExtXformOptions {
  tag: string;
}

export interface ExtModel {
  width: number;
  height: number;
}

class ExtXform extends BaseXform {
  _tag: string;

  override get tag() {
    return this._tag;
  }

  constructor(options: ExtXformOptions) {
    super();

    this._tag = options.tag;
    this.map = {};
  }

  override render(xmlStream: XmlStream, model: ExtModel) {
    xmlStream.openNode(this.tag);

    const width = Math.floor(model.width * EMU_PER_PIXEL_AT_96_DPI);
    const height = Math.floor(model.height * EMU_PER_PIXEL_AT_96_DPI);

    xmlStream.addAttribute('cx', width);
    xmlStream.addAttribute('cy', height);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        width: parseInt(attrs.cx || '0', 10) / EMU_PER_PIXEL_AT_96_DPI,
        height: parseInt(attrs.cy || '0', 10) / EMU_PER_PIXEL_AT_96_DPI,
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

export default ExtXform;
