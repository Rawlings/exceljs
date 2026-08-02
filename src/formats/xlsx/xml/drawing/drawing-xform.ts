import colCache from '../../../../utils/data/col-cache';
import XmlStream from '../../../../utils/stream/xml-stream';

import BaseXform from '../base-xform';
import TwoCellAnchorXform, { type TwoCellAnchorModel } from './two-cell-anchor-xform';
import OneCellAnchorXform, { type OneCellAnchorModel } from './one-cell-anchor-xform';
import type { SaxNode } from '../base-xform';

type AnchorModel = (TwoCellAnchorModel | OneCellAnchorModel) & { anchorType?: string };

export interface DrawingModel {
  anchors: AnchorModel[];
}

function getAnchorType(model: AnchorModel) {
  const range =
    typeof model.range === 'string' ? colCache.decode(model.range) : model.range;

  return (range as { br?: unknown } | undefined)?.br ? 'xdr:twoCellAnchor' : 'xdr:oneCellAnchor';
}

class DrawingXform extends BaseXform {
  static DRAWING_ATTRIBUTES: Record<string, string>;

  constructor(_options?: unknown) {
    super();

    this.map = {
      'xdr:twoCellAnchor': new TwoCellAnchorXform(),
      'xdr:oneCellAnchor': new OneCellAnchorXform(),
    };
  }

  override prepare(model: DrawingModel) {
    model.anchors.forEach((item: AnchorModel, index: number) => {
      item.anchorType = getAnchorType(item);
      const anchor = this.map[item.anchorType];
      anchor.prepare(item, { index });
    });
  }

  override get tag() {
    return 'xdr:wsDr';
  }

  override render(xmlStream: XmlStream, model: DrawingModel) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, DrawingXform.DRAWING_ATTRIBUTES);

    model.anchors.forEach((item: AnchorModel) => {
      const anchor = this.map[item.anchorType as string];
      anchor.render(xmlStream, item);
    });

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
        this.model = {
          anchors: [],
        };
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

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name?: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.anchors.push(this.parser.model);
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        return false;
      default:
        // could be some unrecognised tags
        return true;
    }
  }

  override reconcile(model: DrawingModel, options: unknown) {
    model.anchors.forEach((anchor: AnchorModel) => {
      if ((anchor as { br?: unknown }).br) {
        this.map['xdr:twoCellAnchor'].reconcile(anchor, options);
      } else {
        this.map['xdr:oneCellAnchor'].reconcile(anchor, options);
      }
    });
  }
}

DrawingXform.DRAWING_ATTRIBUTES = {
  'xmlns:xdr': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
  'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
};

export default DrawingXform;
