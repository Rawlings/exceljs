import BaseXform from '../../base-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

class VmlProtectionXform extends BaseXform {
  declare _model: { tag: string } | undefined;
  text: string | undefined;

  constructor(model: { tag: string } | undefined) {
    super();
    this._model = model;
  }

  override get tag() {
    return this._model && this._model.tag;
  }

  override render(xmlStream: XmlStream, model: unknown) {
    xmlStream.leafNode(this.tag as string, undefined, model);
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

export default VmlProtectionXform;
