import BaseXform from '#src/xlsx/xform/base-xform';
import StaticXform from '#src/xlsx/xform/static-xform';

import BlipFillXform from '#src/xlsx/xform/drawing/blip-fill-xform';
import NvPicPrXform from '#src/xlsx/xform/drawing/nv-pic-pr-xform';

import spPrJSON from '#src/xlsx/xform/drawing/sp-pr';

class PicXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      'xdr:nvPicPr': new NvPicPrXform(),
      'xdr:blipFill': new BlipFillXform(),
      'xdr:spPr': new StaticXform(spPrJSON),
    };
  }

  get tag() {
    return 'xdr:pic';
  }

  prepare(model: any, options: any) {
    model.index = options.index + 1;
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag);

    this.map['xdr:nvPicPr'].render(xmlStream, model);
    this.map['xdr:blipFill'].render(xmlStream, model);
    this.map['xdr:spPr'].render(xmlStream, model);

    xmlStream.closeNode();
  }

  parseOpen(node: any) {
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

  parseText() {}

  parseClose(name: any) {
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
