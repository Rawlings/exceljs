import BaseXform from '../../base-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

class VmlPositionXform extends BaseXform {
  private _tag: string | undefined;

  constructor(model: { tag: string } | undefined) {
    super();
    this._tag = model?.tag;
  }

  override get tag() {
    return this._tag;
  }

  override render(xmlStream: XmlStream, model: unknown, type: unknown[]) {
    if (this.tag === 'x:MoveWithCells' && (model === type[0] || model === type[1])) {
      xmlStream.leafNode(this.tag);
    } else if (this.tag === 'x:SizeWithCells' && model === type[0]) {
      xmlStream.leafNode(this.tag);
    }
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case this.tag:
        this.model = {};
        this.model[this.tag as string] = true;
        return true;
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default VmlPositionXform;
