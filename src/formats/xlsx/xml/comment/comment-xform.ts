import RichTextXform from '#src/formats/xlsx/xml/strings/rich-text-xform';
import BaseXform from '#src/formats/xlsx/xml/base-xform';

export default class CommentXform extends BaseXform {
  _richTextXform: any;

  constructor(model?: any) {
    super();
    this.model = model;
  }

  get tag() {
    return 'r';
  }

  get richTextXform() {
    if (!this._richTextXform) {
      this._richTextXform = new RichTextXform();
    }
    return this._richTextXform;
  }

  render(xmlStream: any, model: any) {
    model = model || this.model;

    xmlStream.openNode('comment', {
      ref: model.ref,
      authorId: 0,
    });
    xmlStream.openNode('text');
    if (model && model.note && model.note.texts) {
      model.note.texts.forEach((text: any) => {
        this.richTextXform.render(xmlStream, text);
      });
    }
    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'comment':
        this.model = {
          type: 'note',
          note: {
            texts: [],
          },
          ...node.attributes,
        };
        return true;
      case 'r':
        this.parser = this.richTextXform;
        this.parser.parseOpen(node);
        return true;
      default:
        return false;
    }
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    switch (name) {
      case 'comment':
        return false;
      case 'r':
        this.model.note.texts.push(this.parser.model);
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
