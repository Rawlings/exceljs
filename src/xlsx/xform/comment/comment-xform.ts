import RichTextXform from '../strings/rich-text-xform';
import utils from '../../../utils/utils';
import BaseXform from '../base-xform';

/**
  <comment ref="B1" authorId="0">
    <text>
      <r>
        <rPr>
          <b/>
          <sz val="9"/>
          <rFont val="宋体"/>
          <charset val="134"/>
        </rPr>
        <t>51422:</t>
      </r>
      <r>
        <rPr>
          <sz val="9"/>
          <rFont val="宋体"/>
          <charset val="134"/>
        </rPr>
        <t xml:space="preserve">&#10;test</t>
      </r>
    </text>
  </comment>
 */

const CommentXform = function (this: any, model: any) {
  this.model = model;
} as any;

export default CommentXform;

utils.inherits(CommentXform, BaseXform, undefined, {
  get tag() {
    return 'r';
  },

  get richTextXform() {
    if (!this._richTextXform) {
      this._richTextXform = new RichTextXform();
    }
    return this._richTextXform;
  },

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
  },

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
  },
  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  },
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
  },
});
