import _ from '#src/utils/helpers/under-dash';
import defaultNumFormats from '#src/formats/xlsx/defaultnumformats';

import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface NumFmtModel {
  id: number;
  formatCode: string;
}

interface DefaultNumFormatEntry {
  f?: string;
}

function hashDefaultFormats(): Record<string, number> {
  const hash: Record<string, number> = {};
  _.each(defaultNumFormats as Record<string, DefaultNumFormatEntry>, (dnf, id) => {
    if (dnf.f) {
      hash[dnf.f] = parseInt(id, 10);
    }
    // at some point, add the other cultures here...
  });
  return hash;
}
const defaultFmtHash: Record<string, number> = hashDefaultFormats();

import utils from '#src/utils/helpers/utils';

// NumFmt encapsulates translation between number format and xlsx
class NumFmtXform extends BaseXform {
  static getDefaultFmtId: (formatCode: string) => number | undefined;
  static getDefaultFmtCode: (numFmtId: number | string) => string | undefined;
  id: number | undefined;
  formatCode: string | undefined;

  constructor(id?: number, formatCode?: string) {
    super();

    this.id = id;
    this.formatCode = formatCode;
  }

  override get tag() {
    return 'numFmt';
  }

  override render(xmlStream: XmlStream, model: NumFmtModel) {
    xmlStream.leafNode('numFmt', { numFmtId: model.id, formatCode: model.formatCode });
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case 'numFmt': {
        const attrs = node.attributes as Record<string, string>;
        this.model = {
          id: parseInt(attrs.numFmtId, 10),
          formatCode: utils.xmlDecode(attrs.formatCode).replace(/[\\](.)/g, '$1'),
        } as NumFmtModel;
        return true;
      }
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

NumFmtXform.getDefaultFmtId = function getDefaultFmtId(formatCode: string) {
  return defaultFmtHash[formatCode];
};

NumFmtXform.getDefaultFmtCode = function getDefaultFmtCode(numFmtId: number | string) {
  const dnf = (defaultNumFormats as Record<string, DefaultNumFormatEntry>)[numFmtId];
  return dnf && dnf.f;
};

export default NumFmtXform;
