import BaseXform from '../base-xform';

import AlignmentXform from './alignment-xform';
import type { AlignmentModel } from './alignment-xform';
import BorderXform from './border-xform';
import type { BorderModel } from './border-xform';
import FillXform from './fill-xform';
import type { FillModel } from './fill-xform';
import FontXform from './font-xform';
import NumFmtXform from './numfmt-xform';
import ProtectionXform from './protection-xform';
import type { ProtectionModel } from './protection-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

// <xf numFmtId="[numFmtId]" fontId="[fontId]" fillId="[fillId]" borderId="[xf.borderId]" xfId="[xfId]">
//   Optional <alignment>
//   Optional <protection>
// </xf>

export interface DxfModel {
  font?: Record<string, unknown>;
  numFmt?: string;
  numFmtId?: number;
  fill?: FillModel;
  alignment?: AlignmentModel;
  border?: BorderModel;
  protection?: ProtectionModel;
}

// Style assists translation from style model to/from xlsx
class DxfXform extends BaseXform {
  override map: {
    alignment: AlignmentXform;
    border: BorderXform;
    fill: FillXform;
    font: FontXform;
    numFmt: NumFmtXform;
    protection: ProtectionXform;
  };

  constructor() {
    super();

    this.map = {
      alignment: new AlignmentXform(),
      border: new BorderXform(),
      fill: new FillXform(),
      font: new FontXform(),
      numFmt: new NumFmtXform(),
      protection: new ProtectionXform(),
    };
  }

  override get tag() {
    return 'dxf';
  }

  // how do we generate dxfid?

  override render(xmlStream: XmlStream, model: DxfModel) {
    xmlStream.openNode(this.tag);

    if (model.font) {
      this.map.font.render(xmlStream, model.font);
    }
    if (model.numFmt && model.numFmtId) {
      const numFmtModel = { id: model.numFmtId, formatCode: model.numFmt };
      this.map.numFmt.render(xmlStream, numFmtModel);
    }
    if (model.fill) {
      this.map.fill.render(xmlStream, model.fill);
    }
    if (model.alignment) {
      this.map.alignment.render(xmlStream, model.alignment);
    }
    if (model.border) {
      this.map.border.render(xmlStream, model.border);
    }
    if (model.protection) {
      this.map.protection.render(xmlStream, model.protection);
    }

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case this.tag:
        // this node is often repeated. Need to reset children
        this.reset();
        return true;
      default:
        this.parser = this.map[node.name as keyof DxfXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        return true;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    if (name === this.tag) {
      this.model = {
        alignment: this.map.alignment.model,
        border: this.map.border.model,
        fill: this.map.fill.model,
        font: this.map.font.model,
        numFmt: this.map.numFmt.model,
        protection: this.map.protection.model,
      };
      return false;
    }

    return true;
  }
}

export default DxfXform;
