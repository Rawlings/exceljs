import BaseXform from '../base-xform';

class DateXform extends BaseXform {
  _tag: any;
  attr: any;
  attrs: any;
  _format: any;
  _parse: any;
  text: any[] = [];

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
    this._format =
      options.format ||
      function (dt: any) {
        try {
          if (Number.isNaN(dt.getTime())) return '';
          return dt.toISOString();
        } catch (e: any) {
          return '';
        }
      };
    this._parse =
      options.parse ||
      function (str: any) {
        return new Date(str);
      };
  }

  render(xmlStream: any, model: any) {
    if (model) {
      xmlStream.openNode(this.tag);
      if (this.attrs) {
        xmlStream.addAttributes(this.attrs);
      }
      if (this.attr) {
        xmlStream.addAttribute(this.attr, this._format(model));
      } else {
        xmlStream.writeText(this._format(model));
      }
      xmlStream.closeNode();
    }
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      if (this.attr) {
        this.model = this._parse(node.attributes[this.attr]);
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
      this.model = this._parse(this.text.join(''));
    }
    return false;
  }
}

export default DateXform;
