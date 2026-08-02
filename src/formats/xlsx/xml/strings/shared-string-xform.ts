import TextXform from '#src/formats/xlsx/xml/strings/text-xform';
import RichTextXform from '#src/formats/xlsx/xml/strings/rich-text-xform';
import PhoneticTextXform from '#src/formats/xlsx/xml/strings/phonetic-text-xform';

import BaseXform from '#src/formats/xlsx/xml/base-xform';

// <si>
//   <r></r><r></r>...
// </si>
// <si>
//   <t></t>
// </si>

class SharedStringXform extends BaseXform {
  constructor(model?: any) {
    super();

    this.model = model;

    this.map = {
      r: new RichTextXform(),
      t: new TextXform(),
      rPh: new PhoneticTextXform(),
    };
  }

  get tag() {
    return 'si';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag);
    if (model && model.hasOwnProperty('richText') && model.richText) {
      if (model.richText.length) {
        model.richText.forEach((text: any) => {
          this.map.r.render(xmlStream, text);
        });
      } else {
        this.map.t.render(xmlStream, '');
      }
    } else if (model !== undefined && model !== null) {
      this.map.t.render(xmlStream, model);
    }
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    const { name } = node;
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    if (name === this.tag) {
      this.model = {};
      return true;
    }
    this.parser = this.map[name];
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    return false;
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        switch (name) {
          case 'r': {
            let rt = this.model.richText;
            if (!rt) {
              rt = this.model.richText = [];
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
