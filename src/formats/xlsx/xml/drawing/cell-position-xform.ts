import BaseXform from '../base-xform';
import IntegerXform from '../simple/integer-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface CellPositionXformOptions {
  tag: string;
}

export interface CellPositionModel {
  nativeCol: number;
  nativeColOff: number;
  nativeRow: number;
  nativeRowOff: number;
}

class CellPositionXform extends BaseXform {
  _tag: string;

  constructor(options: CellPositionXformOptions) {
    super();

    this._tag = options.tag;
    this.map = {
      'xdr:col': new IntegerXform({ tag: 'xdr:col', zero: true }),
      'xdr:colOff': new IntegerXform({ tag: 'xdr:colOff', zero: true }),
      'xdr:row': new IntegerXform({ tag: 'xdr:row', zero: true }),
      'xdr:rowOff': new IntegerXform({ tag: 'xdr:rowOff', zero: true }),
    };
  }

  override get tag() {
    return this._tag;
  }

  override render(xmlStream: XmlStream, model: CellPositionModel) {
    xmlStream.openNode(this.tag);

    this.map['xdr:col'].render(xmlStream, model.nativeCol);
    this.map['xdr:colOff'].render(xmlStream, model.nativeColOff);

    this.map['xdr:row'].render(xmlStream, model.nativeRow);
    this.map['xdr:rowOff'].render(xmlStream, model.nativeRowOff);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.reset();
        break;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name?: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model = {
          nativeCol: this.map['xdr:col'].model,
          nativeColOff: this.map['xdr:colOff'].model,
          nativeRow: this.map['xdr:row'].model,
          nativeRowOff: this.map['xdr:rowOff'].model,
        };
        return false;
      default:
        // not quite sure how we get here!
        return true;
    }
  }
}

export default CellPositionXform;
