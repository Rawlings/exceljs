import BaseCellAnchorXform from '#src/formats/xlsx/xml/drawing/base-cell-anchor-xform';
import StaticXform from '#src/formats/xlsx/xml/static-xform';

import CellPositionXform from '#src/formats/xlsx/xml/drawing/cell-position-xform';
import ExtXform from '#src/formats/xlsx/xml/drawing/ext-xform';
import PicXform from '#src/formats/xlsx/xml/drawing/pic-xform';

class OneCellAnchorXform extends BaseCellAnchorXform {
  constructor() {
    super();

    this.map = {
      'xdr:from': new CellPositionXform({ tag: 'xdr:from' }),
      'xdr:ext': new ExtXform({ tag: 'xdr:ext' }),
      'xdr:pic': new PicXform(),
      'xdr:clientData': new StaticXform({ tag: 'xdr:clientData' }),
    };
  }

  get tag() {
    return 'xdr:oneCellAnchor';
  }

  prepare(model: any, options: any) {
    this.map['xdr:pic'].prepare(model.picture, options);
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, { editAs: model.range.editAs || 'oneCell' });

    this.map['xdr:from'].render(xmlStream, model.range.tl);
    this.map['xdr:ext'].render(xmlStream, model.range.ext);
    this.map['xdr:pic'].render(xmlStream, model.picture);
    this.map['xdr:clientData'].render(xmlStream, {});

    xmlStream.closeNode();
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model.range.tl = this.map['xdr:from'].model;
        this.model.range.ext = this.map['xdr:ext'].model;
        this.model.picture = this.map['xdr:pic'].model;
        return false;
      default:
        // could be some unrecognised tags
        return true;
    }
  }

  reconcile(model: any, options: any) {
    model.medium = this.reconcilePicture(model.picture, options);
  }
}

export default OneCellAnchorXform;
