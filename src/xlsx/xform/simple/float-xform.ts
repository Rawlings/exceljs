import BaseXform from '../base-xform';

class FloatXform extends BaseXform {
  _tag: any;
  attr: any;
  attrs: any;
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
  }

  render(xmlStream: any, model: any) {
    if (model !== undefined) {
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
        this.model = parseFloat(node.attributes[this.attr]);
      } else {
        this.text = [];
      }
    }
  }

  parseText(text: any) {
    if (!this.attr) {
      this.text.push(text);
    }
  }

  parseClose() {
    if (!this.attr) {
      this.model = parseFloat(this.text.join(''));
    }
    return false;
  }
}

export default FloatXform;
