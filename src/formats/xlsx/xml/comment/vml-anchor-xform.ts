import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface RefAddress {
  col: number;
  row: number;
}

export interface VmlAnchorModel {
  anchor?: AnchorRect;
  refAddress?: RefAddress;
}

// render the triangle in the cell for the comment
class VmlAnchorXform extends BaseXform {
  text: string | undefined;

  override get tag() {
    return 'x:Anchor';
  }

  getAnchorRect(anchor: AnchorRect) {
    const l = Math.floor(anchor.left);
    const lf = Math.floor((anchor.left - l) * 68);
    const t = Math.floor(anchor.top);
    const tf = Math.floor((anchor.top - t) * 18);
    const r = Math.floor(anchor.right);
    const rf = Math.floor((anchor.right - r) * 68);
    const b = Math.floor(anchor.bottom);
    const bf = Math.floor((anchor.bottom - b) * 18);
    return [l, lf, t, tf, r, rf, b, bf];
  }

  getDefaultRect(ref: RefAddress) {
    const l = ref.col;
    const lf = 6;
    const t = Math.max(ref.row - 2, 0);
    const tf = 14;
    const r = l + 2;
    const rf = 2;
    const b = t + 4;
    const bf = 16;
    return [l, lf, t, tf, r, rf, b, bf];
  }

  override render(xmlStream: XmlStream, model: VmlAnchorModel) {
    const rect = model.anchor
      ? this.getAnchorRect(model.anchor)
      : this.getDefaultRect(model.refAddress as RefAddress);

    xmlStream.leafNode('x:Anchor', undefined, rect.join(', '));
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case this.tag:
        this.text = '';
        return true;
      default:
        return false;
    }
  }

  override parseText(text: string) {
    this.text = text;
  }

  override parseClose() {
    return false;
  }
}

export default VmlAnchorXform;
