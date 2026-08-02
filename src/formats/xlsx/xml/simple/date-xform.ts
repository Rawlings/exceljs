import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface DateXformOptions {
  tag?: string;
  attr?: string;
  attrs?: Record<string, unknown>;
  format?: (dt: unknown) => string;
  parse?: (str: string) => unknown;
}

class DateXform extends BaseXform {
  _tag: string | undefined;
  attr: string | undefined;
  attrs: Record<string, unknown> | undefined;
  _format: (dt: unknown) => string;
  _parse: (str: string) => unknown;
  text: string[] = [];

  override get tag(): string | undefined {
    return this._tag;
  }

  override set tag(val: string | undefined) {
    this._tag = val;
  }

  constructor(options?: DateXformOptions) {
    super();
    options = options || {};

    this.tag = options.tag;
    this.attr = options.attr;
    this.attrs = options.attrs;
    this._format =
      options.format ||
      function (dt: unknown) {
        try {
          const dateObj = dt instanceof Date ? dt : new Date(dt as string | number);
          if (Number.isNaN(dateObj.getTime())) return '';
          return dateObj.toISOString();
        } catch {
          return '';
        }
      };
    this._parse =
      options.parse ||
      function (str: string) {
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

  override render(xmlStream: XmlStream, model: unknown) {
    if (model !== undefined && model !== null) {
      const val = this._toDate(model);
      const formatted = this._format(val);
      if (formatted !== '') {
        xmlStream.openNode(this.tag as string);
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

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      if (this.attr) {
        this.model = this._parse((node.attributes as Record<string, string>)[this.attr]);
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
      this.model = this._parse(this.text.join(''));
    }
    return false;
  }
}

export default DateXform;
