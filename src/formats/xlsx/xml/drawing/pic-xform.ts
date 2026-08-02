import BaseXform from '#src/formats/xlsx/xml/base-xform';
import StaticXform from '#src/formats/xlsx/xml/static-xform';

import BlipFillXform, { type BlipFillModel } from '#src/formats/xlsx/xml/drawing/blip-fill-xform';
import NvPicPrXform, { type NvPicPrModel } from '#src/formats/xlsx/xml/drawing/nv-pic-pr-xform';

import spPrJSON from '#src/formats/xlsx/xml/drawing/sp-pr';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface PicModel extends NvPicPrModel, BlipFillModel {
  index?: number;
}

class PicXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      'xdr:nvPicPr': new NvPicPrXform(),
      'xdr:blipFill': new BlipFillXform(),
      'xdr:spPr': new StaticXform(spPrJSON),
    };
  }

  override get tag() {
    return 'xdr:pic';
  }

  override prepare(model: PicModel, options: { index: number }) {
    model.index = options.index + 1;
  }

  override render(xmlStream: XmlStream, model: PicModel) {
    xmlStream.openNode(this.tag as string);

    this.map['xdr:nvPicPr'].render(xmlStream, model);
    this.map['xdr:blipFill'].render(xmlStream, model);
    this.map['xdr:spPr'].render(xmlStream, model);

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
        this.mergeModel(this.parser.model);
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        return false;
      default:
        // not quite sure how we get here!
        return true;
    }
  }
}

export default PicXform;
