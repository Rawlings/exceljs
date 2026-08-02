import TextXform from '#src/formats/xlsx/xml/strings/text-xform';
import FontXform from '#src/formats/xlsx/xml/style/font-xform';
import type { FontXformOptions } from '#src/formats/xlsx/xml/style/font-xform';

import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

// <r>
//   <rPr>
//     <sz val="11"/>
//     <color theme="1" tint="5"/>
//     <rFont val="Calibri"/>
//     <family val="2"/>
//     <scheme val="minor"/>
//   </rPr>
//   <t xml:space="preserve"> is </t>
// </r>

export interface RichTextRunModel {
  font?: Record<string, unknown>;
  text?: string;
}

class RichTextXform extends BaseXform {
  static FONT_OPTIONS: FontXformOptions;
  _textXform: TextXform | undefined;
  _fontXform: FontXform | undefined;

  constructor(model?: RichTextRunModel) {
    super();

    this.model = model;
  }

  override get tag() {
    return 'r';
  }

  get textXform(): TextXform {
    return this._textXform || (this._textXform = new TextXform());
  }

  get fontXform(): FontXform {
    return this._fontXform || (this._fontXform = new FontXform(RichTextXform.FONT_OPTIONS));
  }

  override render(xmlStream: XmlStream, modelInput?: RichTextRunModel) {
    const model = modelInput || (this.model as RichTextRunModel);

    xmlStream.openNode('r');
    if (model.font) {
      this.fontXform.render(xmlStream, model.font);
    }
    this.textXform.render(xmlStream, model.text);
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'r':
        this.model = {};
        return true;
      case 't':
        this.parser = this.textXform;
        this.parser.parseOpen(node);
        return true;
      case 'rPr':
        this.parser = this.fontXform;
        this.parser.parseOpen(node);
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
    switch (name) {
      case 'r':
        return false;
      case 't':
        (this.model as RichTextRunModel).text = this.parser.model;
        this.parser = undefined;
        return true;
      case 'rPr':
        (this.model as RichTextRunModel).font = this.parser.model;
        this.parser = undefined;
        return true;
      default:
        if (this.parser) {
          this.parser.parseClose(name);
        }
        return true;
    }
  }
}

RichTextXform.FONT_OPTIONS = {
  tagName: 'rPr',
  fontNameTag: 'rFont',
};

export default RichTextXform;
