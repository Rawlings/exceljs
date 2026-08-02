import TextXform from '#src/formats/xlsx/xml/strings/text-xform';
import RichTextXform from '#src/formats/xlsx/xml/strings/rich-text-xform';
import type { RichTextRunModel } from '#src/formats/xlsx/xml/strings/rich-text-xform';
import PhoneticTextXform from '#src/formats/xlsx/xml/strings/phonetic-text-xform';

import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

// <si>
//   <r></r><r></r>...
// </si>
// <si>
//   <t></t>
// </si>

export interface RichSharedStringModel {
  richText: RichTextRunModel[];
}

export type SharedStringModel = string | RichSharedStringModel;

class SharedStringXform extends BaseXform {
  override map: { r: RichTextXform; t: TextXform; rPh: PhoneticTextXform };

  constructor(model?: SharedStringModel) {
    super();

    this.model = model;

    this.map = {
      r: new RichTextXform(),
      t: new TextXform(),
      rPh: new PhoneticTextXform(),
    };
  }

  override get tag() {
    return 'si';
  }

  override render(xmlStream: XmlStream, model: SharedStringModel) {
    xmlStream.openNode(this.tag as string);
    if (model && Object.prototype.hasOwnProperty.call(model, 'richText') && (model as RichSharedStringModel).richText) {
      const richText = (model as RichSharedStringModel).richText;
      if (richText.length) {
        richText.forEach((text) => {
          this.map.r.render(xmlStream, text);
        });
      } else {
        this.map.t.render(xmlStream, '');
      }
    } else if (model !== undefined && model !== null) {
      this.map.t.render(xmlStream, model as string);
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
      this.model = {};
      return true;
    }
    this.parser = this.map[name as keyof SharedStringXform['map']];
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
        switch (name) {
          case 'r': {
            const model = this.model as RichSharedStringModel;
            let rt = model.richText;
            if (!rt) {
              rt = model.richText = [];
            }
            rt.push(this.parser.model);
            break;
          }
          case 't':
            this.model = this.parser.model;
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

export default SharedStringXform;
