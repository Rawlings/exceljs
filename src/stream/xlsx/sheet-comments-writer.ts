import XmlStream from '../../utils/xml-stream';
import RelType from '../../xlsx/rel-type';
import colCache from '../../utils/col-cache';
import CommentXform from '../../xlsx/xform/comment/comment-xform';
import VmlShapeXform from '../../xlsx/xform/comment/vml-shape-xform';

class SheetCommentsWriter {
  id: any;
  count: any;
  _worksheet: any;
  _workbook: any;
  _sheetRelsWriter: any;
  _commentsStream: any;
  _vmlStream: any;
  startedData: any;
  vmlRelId: any;

  constructor(worksheet: any, sheetRelsWriter: any, options: any) {
    // in a workbook, each sheet will have a number
    this.id = options.id;
    this.count = 0;
    this._worksheet = worksheet;
    this._workbook = options.workbook;
    this._sheetRelsWriter = sheetRelsWriter;
  }

  get commentsStream() {
    if (!this._commentsStream) {
      // eslint-disable-next-line no-underscore-dangle
      this._commentsStream = this._workbook._openStream(`/xl/comments${this.id}.xml`);
    }
    return this._commentsStream;
  }

  get vmlStream() {
    if (!this._vmlStream) {
      // eslint-disable-next-line no-underscore-dangle
      this._vmlStream = this._workbook._openStream(`xl/drawings/vmlDrawing${this.id}.vml`);
    }
    return this._vmlStream;
  }

  _addRelationships() {
    const commentRel = {
      Type: RelType.Comments,
      Target: `../comments${this.id}.xml`,
    };
    this._sheetRelsWriter.addRelationship(commentRel);

    const vmlDrawingRel = {
      Type: RelType.VmlDrawing,
      Target: `../drawings/vmlDrawing${this.id}.vml`,
    };
    this.vmlRelId = this._sheetRelsWriter.addRelationship(vmlDrawingRel);
  }

  _addCommentRefs() {
    this._workbook.commentRefs.push({
      commentName: `comments${this.id}`,
      vmlDrawing: `vmlDrawing${this.id}`,
    });
  }

  _writeOpen() {
    this.commentsStream.write(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<authors><author>Author</author></authors>' +
        '<commentList>'
    );
    this.vmlStream.write(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<xml xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
        '<o:shapelayout v:ext="edit">' +
        '<o:idmap v:ext="edit" data="1" />' +
        '</o:shapelayout>' +
        '<v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe">' +
        '<v:stroke joinstyle="miter" />' +
        '<v:path gradientshapeok="t" o:connecttype="rect" />' +
        '</v:shapetype>'
    );
  }

  _writeComment(comment: any, index: any) {
    const commentXform = new CommentXform();
    const commentsXmlStream = new XmlStream();
    commentXform.render(commentsXmlStream, comment);
    this.commentsStream.write(commentsXmlStream.xml);

    const vmlShapeXform = new VmlShapeXform();
    const vmlXmlStream = new XmlStream();
    vmlShapeXform.render(vmlXmlStream, comment, index);
    this.vmlStream.write(vmlXmlStream.xml);
  }

  _writeClose() {
    this.commentsStream.write('</commentList></comments>');
    this.vmlStream.write('</xml>');
  }

  addComments(comments: any) {
    if (comments && comments.length) {
      if (!this.startedData) {
        this._worksheet.comments = [];
        this._writeOpen();
        this._addRelationships();
        this._addCommentRefs();
        this.startedData = true;
      }

      comments.forEach((item: any) => {
        item.refAddress = colCache.decodeAddress(item.ref);
      });

      comments.forEach((comment: any) => {
        this._writeComment(comment, this.count);
        this.count += 1;
      });
    }
  }

  commit() {
    if (this.count) {
      this._writeClose();
      this.commentsStream.end();
      this.vmlStream.end();
    }
  }
}

export default SheetCommentsWriter;
