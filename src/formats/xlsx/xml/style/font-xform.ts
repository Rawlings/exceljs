'use strict';

import ColorXform from '#src/formats/xlsx/xml/style/color-xform';
import BooleanXform from '#src/formats/xlsx/xml/simple/boolean-xform';
import IntegerXform from '#src/formats/xlsx/xml/simple/integer-xform';
import StringXform from '#src/formats/xlsx/xml/simple/string-xform';
import UnderlineXform from '#src/formats/xlsx/xml/style/underline-xform';

import _ from '#src/utils/helpers/under-dash';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface FontXformOptions {
  tagName: string;
  fontNameTag: string;
}

interface FontFieldEntry {
  prop: string;
  xform: BaseXform;
}

// Font encapsulates translation from font model to xlsx
class FontXform extends BaseXform {
  static OPTIONS: FontXformOptions;
  options: FontXformOptions;
  override map: Record<string, FontFieldEntry>;

  constructor(options?: FontXformOptions) {
    super();

    this.options = options || FontXform.OPTIONS;

    this.map = {
      b: { prop: 'bold', xform: new BooleanXform({ tag: 'b', attr: 'val' }) },
      i: { prop: 'italic', xform: new BooleanXform({ tag: 'i', attr: 'val' }) },
      u: { prop: 'underline', xform: new UnderlineXform() },
      charset: { prop: 'charset', xform: new IntegerXform({ tag: 'charset', attr: 'val' }) },
      color: { prop: 'color', xform: new ColorXform() },
      condense: { prop: 'condense', xform: new BooleanXform({ tag: 'condense', attr: 'val' }) },
      extend: { prop: 'extend', xform: new BooleanXform({ tag: 'extend', attr: 'val' }) },
      family: { prop: 'family', xform: new IntegerXform({ tag: 'family', attr: 'val' }) },
      outline: { prop: 'outline', xform: new BooleanXform({ tag: 'outline', attr: 'val' }) },
      vertAlign: { prop: 'vertAlign', xform: new StringXform({ tag: 'vertAlign', attr: 'val' }) },
      scheme: { prop: 'scheme', xform: new StringXform({ tag: 'scheme', attr: 'val' }) },
      shadow: { prop: 'shadow', xform: new BooleanXform({ tag: 'shadow', attr: 'val' }) },
      strike: { prop: 'strike', xform: new BooleanXform({ tag: 'strike', attr: 'val' }) },
      sz: { prop: 'size', xform: new IntegerXform({ tag: 'sz', attr: 'val' }) },
    };
    this.map[this.options.fontNameTag] = {
      prop: 'name',
      xform: new StringXform({ tag: this.options.fontNameTag, attr: 'val' }),
    };
  }

  override get tag() {
    return this.options.tagName;
  }

  override render(xmlStream: XmlStream, model: Record<string, unknown>) {
    const { map } = this;

    xmlStream.openNode(this.options.tagName);
    _.each(this.map, (defn, tag) => {
      map[tag].xform.render(xmlStream, model[defn.prop]);
    });
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    if (this.map[node.name]) {
      this.parser = this.map[node.name].xform;
      return this.parser.parseOpen(node) as boolean;
    }
    switch (node.name) {
      case this.options.tagName:
        this.model = {};
        return true;
      default:
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser && !this.parser.parseClose(name)) {
      const item = this.map[name];
      if (this.parser.model) {
        (this.model as Record<string, unknown>)[item.prop] = this.parser.model;
      }
      this.parser = undefined;
      return true;
    }
    switch (name) {
      case this.options.tagName:
        return false;
      default:
        return true;
    }
  }
}

FontXform.OPTIONS = {
  tagName: 'font',
  fontNameTag: 'name',
};

export default FontXform;
