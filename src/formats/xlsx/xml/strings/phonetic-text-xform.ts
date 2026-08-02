import TextXform from '#src/formats/xlsx/xml/strings/text-xform';
import RichTextXform from '#src/formats/xlsx/xml/strings/rich-text-xform';
import type { RichTextRunModel } from '#src/formats/xlsx/xml/strings/rich-text-xform';

import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

// <rPh sb="0" eb="1">
//   <t>(its pronounciation in KATAKANA)</t>
// </rPh>

export interface PhoneticTextModel {
  sb?: number;
  eb?: number;
  richText?: RichTextRunModel[];
  text?: string;
}

class PhoneticTextXform extends BaseXform {
  override map: { r: RichTextXform; t: TextXform };

  constructor() {
    super();

    this.map = {
      r: new RichTextXform(),
      t: new TextXform(),
    };
  }

  override get tag() {
    return 'rPh';
  }

  override render(xmlStream: XmlStream, model: PhoneticTextModel) {
    xmlStream.openNode(this.tag as string, {
      sb: model.sb || 0,
      eb: model.eb || 0,
    });
    if (model && Object.prototype.hasOwnProperty.call(model, 'richText') && model.richText) {
      const { r } = this.map;
      model.richText.forEach((text) => {
        r.render(xmlStream, text);
      });
    } else if (model) {
      this.map.t.render(xmlStream, model.text as string);
    }
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    const { name } = node;
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    if (name === this.tag) {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        sb: parseInt(attrs.sb, 10),
        eb: parseInt(attrs.eb, 10),
      };
      return true;
    }
    this.parser = this.map[name as keyof PhoneticTextXform['map']];
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    return false;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        const model = this.model as PhoneticTextModel;
        switch (name) {
          case 'r': {
            let rt = model.richText;
            if (!rt) {
              rt = model.richText = [];
            }
            rt.push(this.parser.model);
            break;
          }
          case 't':
            model.text = this.parser.model;
            break;
          default:
            break;
        }
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        return false;
      default:
        return true;
    }
  }
}

export default PhoneticTextXform;
