import BaseCellAnchorXform, { type CellAnchorModel } from './base-cell-anchor-xform';
import StaticXform from '../static-xform';

import CellPositionXform from './cell-position-xform';
import PicXform from './pic-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';

export type TwoCellAnchorModel = CellAnchorModel;

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

  override get tag() {
    return 'xdr:twoCellAnchor';
  }

  override prepare(model: TwoCellAnchorModel, options: any) {
    this.map['xdr:pic'].prepare(model.picture, options);
  }

  override render(xmlStream: XmlStream, model: TwoCellAnchorModel) {
    xmlStream.openNode(this.tag, { editAs: model.range?.editAs || 'oneCell' });

    this.map['xdr:from'].render(xmlStream, model.range?.tl);
    this.map['xdr:to'].render(xmlStream, model.range?.br);
    this.map['xdr:pic'].render(xmlStream, model.picture);
    this.map['xdr:clientData'].render(xmlStream, {});

    xmlStream.closeNode();
  }

  override parseClose(name?: string) {
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

  override reconcile(model: TwoCellAnchorModel, options: any) {
    model.medium = this.reconcilePicture(model.picture, options);
  }
}

export default TwoCellAnchorXform;
