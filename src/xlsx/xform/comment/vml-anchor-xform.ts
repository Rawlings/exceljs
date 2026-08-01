import BaseXform from '../base-xform';

// render the triangle in the cell for the comment
class VmlAnchorXform extends BaseXform {
  text: any;

  get tag() {
    return 'x:Anchor';
  }

  getAnchorRect(anchor: any) {
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

  getDefaultRect(ref: any) {
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

  render(xmlStream: any, model: any) {
    const rect = model.anchor
      ? this.getAnchorRect(model.anchor)
      : this.getDefaultRect(model.refAddress);

    xmlStream.leafNode('x:Anchor', null, rect.join(', '));
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        this.text = '';
        return true;
      default:
        return false;
    }
  }

  parseText(text: any) {
    this.text = text;
  }

  parseClose() {
    return false;
  }
}

export default VmlAnchorXform;
