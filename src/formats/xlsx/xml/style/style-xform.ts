import BaseXform from '../base-xform';

import AlignmentXform from './alignment-xform';
import type { AlignmentModel } from './alignment-xform';
import ProtectionXform from './protection-xform';
import type { ProtectionModel } from './protection-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

// <xf numFmtId="[numFmtId]" fontId="[fontId]" fillId="[fillId]" borderId="[xf.borderId]" xfId="[xfId]">
//   Optional <alignment>
//   Optional <protection>
// </xf>

export interface StyleXfModel {
  numFmtId?: number;
  fontId?: number;
  fillId?: number;
  borderId?: number;
  xfId?: number;
  alignment?: AlignmentModel;
  protection?: ProtectionModel;
}

export interface StyleXformOptions {
  xfId?: boolean;
}

// Style assists translation from style model to/from xlsx
class StyleXform extends BaseXform {
  xfId: boolean;
  override map: { alignment: AlignmentXform; protection: ProtectionXform };

  constructor(options?: StyleXformOptions) {
    super();

    this.xfId = !!(options && options.xfId);
    this.map = {
      alignment: new AlignmentXform(),
      protection: new ProtectionXform(),
    };
  }

  override get tag() {
    return 'xf';
  }

  override render(xmlStream: XmlStream, model: StyleXfModel) {
    xmlStream.openNode('xf', {
      numFmtId: model.numFmtId || 0,
      fontId: model.fontId || 0,
      fillId: model.fillId || 0,
      borderId: model.borderId || 0,
    });
    if (this.xfId) {
      xmlStream.addAttribute('xfId', model.xfId || 0);
    }

    if (model.numFmtId) {
      xmlStream.addAttribute('applyNumberFormat', '1');
    }
    if (model.fontId) {
      xmlStream.addAttribute('applyFont', '1');
    }
    if (model.fillId) {
      xmlStream.addAttribute('applyFill', '1');
    }
    if (model.borderId) {
      xmlStream.addAttribute('applyBorder', '1');
    }
    if (model.alignment) {
      xmlStream.addAttribute('applyAlignment', '1');
    }
    if (model.protection) {
      xmlStream.addAttribute('applyProtection', '1');
    }

    /**
     * Rendering tags causes close of XML stream.
     * Therefore adding attributes must be done before rendering tags.
     */

    if (model.alignment) {
      this.map.alignment.render(xmlStream, model.alignment);
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
    // used during sax parsing of xml to build font object
    switch (node.name) {
      case 'xf': {
        const attrs = node.attributes as Record<string, string>;
        const model: StyleXfModel = {
          numFmtId: parseInt(attrs.numFmtId, 10),
          fontId: parseInt(attrs.fontId, 10),
          fillId: parseInt(attrs.fillId, 10),
          borderId: parseInt(attrs.borderId, 10),
        };
        if (this.xfId) {
          model.xfId = parseInt(attrs.xfId, 10);
        }
        this.model = model;
        return true;
      }
      case 'alignment':
        this.parser = this.map.alignment;
        this.parser.parseOpen(node);
        return true;
      case 'protection':
        this.parser = this.map.protection;
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
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        if (this.map.protection === this.parser) {
          this.model.protection = this.parser.model;
        } else {
          this.model.alignment = this.parser.model;
        }
        this.parser = undefined;
      }
      return true;
    }
    return name !== 'xf';
  }
}

export default StyleXform;
