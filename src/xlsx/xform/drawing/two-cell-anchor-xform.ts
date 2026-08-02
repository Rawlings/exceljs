import BaseCellAnchorXform from '#src/xlsx/xform/drawing/base-cell-anchor-xform';
import StaticXform from '#src/xlsx/xform/static-xform';

import CellPositionXform from '#src/xlsx/xform/drawing/cell-position-xform';
import PicXform from '#src/xlsx/xform/drawing/pic-xform';

class TwoCellAnchorXform extends BaseCellAnchorXform {
  constructor() {
    super();

    this.map = {
      'xdr:from': new CellPositionXform({ tag: 'xdr:from' }),
      'xdr:to': new CellPositionXform({ tag: 'xdr:to' }),
      'xdr:pic': new PicXform(),
      'xdr:clientData': new StaticXform({ tag: 'xdr:clientData' }),
    };
  }

  get tag() {
    return 'xdr:twoCellAnchor';
  }

  prepare(model: any, options: any) {
    this.map['xdr:pic'].prepare(model.picture, options);
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, { editAs: model.range.editAs || 'oneCell' });

    this.map['xdr:from'].render(xmlStream, model.range.tl);
    this.map['xdr:to'].render(xmlStream, model.range.br);
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
        this.model.range.br = this.map['xdr:to'].model;
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

export default TwoCellAnchorXform;
