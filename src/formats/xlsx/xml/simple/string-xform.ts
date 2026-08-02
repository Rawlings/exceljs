import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface StringXformOptions {
  tag?: string;
  attr?: string;
  attrs?: Record<string, unknown>;
}

class StringXform extends BaseXform {
  _tag: string | undefined;
  attr: string | undefined;
  attrs: Record<string, unknown> | undefined;
  text: string[] = [];

  override get tag(): string | undefined {
    return this._tag;
  }

  override set tag(val: string | undefined) {
    this._tag = val;
  }

  constructor(options?: StringXformOptions) {
    super();
    options = options || {};

    this.tag = options.tag;
    this.attr = options.attr;
    this.attrs = options.attrs;
  }

  override render(xmlStream: XmlStream, model: unknown) {
    if (model !== undefined) {
      xmlStream.openNode(this.tag as string);
      if (this.attrs) {
        xmlStream.addAttributes(this.attrs);
      }
      if (this.attr) {
        xmlStream.addAttribute(this.attr, model);
      } else {
        xmlStream.writeText(model);
      }
      xmlStream.closeNode();
    }
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      if (this.attr) {
        this.model = (node.attributes as Record<string, string>)[this.attr];
      } else {
        this.text = [];
      }
    }
  }

  override parseText(text: string) {
    if (!this.attr) {
      this.text.push(text);
    }
  }

  override parseClose() {
    if (!this.attr) {
      this.model = this.text.join('');
    }
    return false;
  }
}

export default StringXform;
