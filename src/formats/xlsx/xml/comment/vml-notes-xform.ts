import XmlStream from '../../../../utils/stream/xml-stream';

import BaseXform from '../base-xform';
import VmlShapeXform from './vml-shape-xform';
import type { SaxNode } from '../base-xform';

// This class is (currently) single purposed to insert the triangle
// drawing icons on commented cells
class VmlNotesXform extends BaseXform {
  static DRAWING_ATTRIBUTES: Record<string, string>;

  override map: {
    'v:shape': VmlShapeXform;
  };

  constructor() {
    super();
    this.map = {
      'v:shape': new VmlShapeXform(),
    };
  }

  override get tag() {
    return 'xml';
  }

  override render(xmlStream: XmlStream, model: any) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, VmlNotesXform.DRAWING_ATTRIBUTES);

    xmlStream.openNode('o:shapelayout', { 'v:ext': 'edit' });
    xmlStream.leafNode('o:idmap', { 'v:ext': 'edit', data: 1 });
    xmlStream.closeNode();

    xmlStream.openNode('v:shapetype', {
      id: '_x0000_t202',
      coordsize: '21600,21600',
      'o:spt': 202,
      path: 'm,l,21600r21600,l21600,xe',
    });
    xmlStream.leafNode('v:stroke', { joinstyle: 'miter' });
    xmlStream.leafNode('v:path', { gradientshapeok: 't', 'o:connecttype': 'rect' });
    xmlStream.closeNode();

    model.comments.forEach((item: any, index: any) => {
      this.map['v:shape'].render(xmlStream, item, index);
    });

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.reset();
        this.model = {
          comments: [],
        };
        break;
      default:
        this.parser = this.map[node.name as keyof VmlNotesXform['map']];
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

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.comments.push(this.parser.model);
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

  // NB: this.map only has a 'v:shape' entry — 'xdr:twoCellAnchor'/'xdr:oneCellAnchor'
  // don't exist on it, so this method throws at runtime if ever invoked. Pre-existing
  // latent bug, left unchanged; using `as any` to preserve the exact runtime behavior.
  override reconcile(model: any, options: any) {
    model.anchors.forEach((anchor: any) => {
      if (anchor.br) {
        (this.map as any)['xdr:twoCellAnchor'].reconcile(anchor, options);
      } else {
        (this.map as any)['xdr:oneCellAnchor'].reconcile(anchor, options);
      }
    });
  }
}

VmlNotesXform.DRAWING_ATTRIBUTES = {
  'xmlns:v': 'urn:schemas-microsoft-com:vml',
  'xmlns:o': 'urn:schemas-microsoft-com:office:office',
  'xmlns:x': 'urn:schemas-microsoft-com:office:excel',
};

export default VmlNotesXform;
