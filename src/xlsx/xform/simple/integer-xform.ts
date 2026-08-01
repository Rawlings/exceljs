import BaseXform from '../base-xform';

class IntegerXform extends BaseXform {
  _tag: any;
  attr: any;
  attrs: any;
  zero: any;
  text: any[];

  override get tag(): any {
    return this._tag;
  }

  override set tag(val: any) {
    this._tag = val;
  }

  constructor(options?: any) {
    super();
    options = options || {};

    this.tag = options.tag;
    this.attr = options.attr;
    this.attrs = options.attrs;

    // option to render zero
    this.zero = options.zero;
  }

  render(xmlStream: any, model: any) {
    // int is different to float in that zero is not rendered
    if (model || this.zero) {
      xmlStream.openNode(this.tag);
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

  parseOpen(node: any) {
    if (node.name === this.tag) {
      if (this.attr) {
        this.model = parseInt(node.attributes[this.attr], 10);
      } else {
        this.text = [];
      }
      return true;
    }
    return false;
  }

  parseText(text: any) {
    if (!this.attr) {
      this.text.push(text);
    }
  }

  parseClose() {
    if (!this.attr) {
      this.model = parseInt(this.text.join('') || 0, 10);
    }
    return false;
  }
}

export default IntegerXform;
