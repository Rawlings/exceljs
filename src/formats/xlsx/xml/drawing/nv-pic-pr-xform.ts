import BaseXform from '../base-xform';
import CNvPrXform, { type CNvPrModel } from './c-nv-pr-xform';
import CNvPicPrXform from './c-nv-pic-pr-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export type NvPicPrModel = CNvPrModel;

class NvPicPrXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      'xdr:cNvPr': new CNvPrXform(),
      'xdr:cNvPicPr': new CNvPicPrXform(),
    };
  }

  override get tag() {
    return 'xdr:nvPicPr';
  }

  override render(xmlStream: XmlStream, model: NvPicPrModel) {
    xmlStream.openNode(this.tag);
    this.map['xdr:cNvPr'].render(xmlStream, model);
    this.map['xdr:cNvPicPr'].render(xmlStream, model);
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case this.tag:
        this.reset();
        break;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  override parseText() {}

  override parseClose(name?: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model = this.map['xdr:cNvPr'].model;
        return false;
      default:
        return true;
    }
  }
}

export default NvPicPrXform;
