import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface IntegerXformOptions {
  tag?: string;
  attr?: string;
  attrs?: Record<string, unknown>;
  zero?: boolean;
}

class IntegerXform extends BaseXform {
  _tag: string | undefined;
  attr: string | undefined;
  attrs: Record<string, unknown> | undefined;
  zero: boolean | undefined;
  text: string[] = [];

  override get tag(): string | undefined {
    return this._tag;
  }

  override set tag(val: string | undefined) {
    this._tag = val;
  }

  constructor(options?: IntegerXformOptions) {
    super();
    options = options || {};

    this.tag = options.tag;
    this.attr = options.attr;
    this.attrs = options.attrs;

    // option to render zero
    this.zero = options.zero;
  }

  override render(xmlStream: XmlStream, model: unknown) {
    // int is different to float in that zero is not rendered
    if (model || this.zero) {
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
        this.model = parseInt((node.attributes as Record<string, string>)[this.attr], 10);
      } else {
        this.text = [];
      }
      return true;
    }
    return false;
  }

  override parseText(text: string) {
    if (!this.attr) {
      this.text.push(text);
    }
  }

  override parseClose() {
    if (!this.attr) {
      this.model = parseInt(String(this.text.join('') || 0), 10);
    }
    return false;
  }
}

export default IntegerXform;
