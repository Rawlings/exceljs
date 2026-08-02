import BaseCellAnchorXform, { type CellAnchorModel } from './base-cell-anchor-xform';
import StaticXform from '../static-xform';

import CellPositionXform from './cell-position-xform';
import ExtXform from './ext-xform';
import PicXform, { type PicModel } from './pic-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';

export type OneCellAnchorModel = CellAnchorModel;

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

  override get tag() {
    return 'xdr:oneCellAnchor';
  }

  override prepare(model: OneCellAnchorModel, options: { index: number }) {
    this.map['xdr:pic'].prepare(model.picture as PicModel, options);
  }

  override render(xmlStream: XmlStream, model: OneCellAnchorModel) {
    xmlStream.openNode(this.tag, { editAs: model.range?.editAs || 'oneCell' });

    this.map['xdr:from'].render(xmlStream, model.range?.tl);
    this.map['xdr:ext'].render(xmlStream, model.range?.ext);
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
        this.model.range.ext = this.map['xdr:ext'].model;
        this.model.picture = this.map['xdr:pic'].model;
        return false;
      default:
        // could be some unrecognised tags
        return true;
    }
  }

  override reconcile(
    model: OneCellAnchorModel,
    options: Parameters<OneCellAnchorXform['reconcilePicture']>[1]
  ) {
    model.medium = this.reconcilePicture(model.picture as { rId?: string } | undefined, options);
  }
}

export default OneCellAnchorXform;
