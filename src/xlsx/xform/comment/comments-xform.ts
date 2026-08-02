import XmlStream from '#src/utils/xml-stream';
import utils from '#src/utils/utils';
import BaseXform from '#src/xlsx/xform/base-xform';

import CommentXform from '#src/xlsx/xform/comment/comment-xform';

const CommentsXform = function (this: any) {
  this.map = {
    comment: new (CommentXform as any)(),
  };
} as any;

export default CommentsXform;

utils.inherits(
  CommentsXform,
  BaseXform,
  {
    COMMENTS_ATTRIBUTES: {
      xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    },
  },
  {
    render(xmlStream: any, model: any) {
      model = model || this.model;
      xmlStream.openXml(XmlStream.StdDocAttributes);
      xmlStream.openNode('comments', CommentsXform.COMMENTS_ATTRIBUTES);

      // authors
      // TODO: support authors properly
      xmlStream.openNode('authors');
      xmlStream.leafNode('author', null, 'Author');
      xmlStream.closeNode();

      // comments
      xmlStream.openNode('commentList');
      model.comments.forEach((comment: any) => {
        this.map.comment.render(xmlStream, comment);
      });
      xmlStream.closeNode();
      xmlStream.closeNode();
    },

    parseOpen(node: any) {
      if (this.parser) {
        this.parser.parseOpen(node);
        return true;
      }
      switch (node.name) {
        case 'commentList':
          this.model = {
            comments: [],
          };
          return true;
        case 'comment':
          this.parser = this.map.comment;
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
        case 'commentList':
          return false;
        case 'comment':
          this.model.comments.push(this.parser.model);
          this.parser = undefined;
          return true;
        default:
          if (this.parser) {
            this.parser.parseClose(name);
          }
          return true;
      }
    },
  }
);
