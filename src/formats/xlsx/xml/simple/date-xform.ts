import BaseXform from '#src/formats/xlsx/xml/base-xform';

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
          const dateObj = dt instanceof Date ? dt : new Date(dt);
          if (Number.isNaN(dateObj.getTime())) return '';
          return dateObj.toISOString();
        } catch {
          return '';
        }
      };
    this._parse =
      options.parse ||
      function (str: any) {
        return str ? new Date(str) : undefined;
      };
  }

  private _toDate(val: unknown): unknown {
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') {
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? val : d;
    }
    return val;
  }

  render(xmlStream: any, model: any) {
    if (model !== undefined && model !== null) {
      const val = this._toDate(model);
      const formatted = this._format(val);
      if (formatted !== '') {
        xmlStream.openNode(this.tag);
        if (this.attrs) {
          xmlStream.addAttributes(this.attrs);
        }
        if (this.attr) {
          xmlStream.addAttribute(this.attr, formatted);
        } else {
          xmlStream.writeText(formatted);
        }
        xmlStream.closeNode();
      }
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
