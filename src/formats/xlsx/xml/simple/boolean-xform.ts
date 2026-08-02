import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface BooleanXformOptions {
  tag?: string;
  attr?: string;
}

class BooleanXform extends BaseXform {
  _tag: string | undefined;
  attr: string | undefined;

  override get tag() {
    return this._tag;
  }

  override set tag(val: string | undefined) {
    this._tag = val;
  }

  constructor(options?: BooleanXformOptions) {
    super();
    options = options || {};

    this.tag = options.tag;
    this.attr = options.attr;
  }

  override render(xmlStream: XmlStream, model: unknown) {
    if (model) {
      xmlStream.openNode(this.tag as string);
      xmlStream.closeNode();
    }
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      this.model = true;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default BooleanXform;
