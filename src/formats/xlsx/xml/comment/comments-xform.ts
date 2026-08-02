import XmlStream from '../../../../utils/stream/xml-stream';
import BaseXform from '../base-xform';
import CommentXform from './comment-xform';
import type { CommentModel } from './comment-xform';
import type { SaxNode } from '../base-xform';

interface CommentsModel {
  comments: CommentModel[];
}

export default class CommentsXform extends BaseXform {
  static COMMENTS_ATTRIBUTES = {
    xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  };

  override map: {
    comment: CommentXform;
  };

  constructor() {
    super();
    this.map = {
      comment: new CommentXform(),
    };
  }

  override render(xmlStream: XmlStream, model: any) {
    model = model || this.model;
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('comments', CommentsXform.COMMENTS_ATTRIBUTES);

    // authors
    // TODO: support authors properly
    xmlStream.openNode('authors');
    xmlStream.leafNode('author', undefined, 'Author');
    xmlStream.closeNode();

    // comments
    xmlStream.openNode('commentList');
    model.comments.forEach((comment: any) => {
      this.map.comment.render(xmlStream, comment);
    });
    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
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
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
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
  }
}
