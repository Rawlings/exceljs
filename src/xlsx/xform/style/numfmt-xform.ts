import _ from '#src/utils/helpers/under-dash';
import defaultNumFormats from '#src/xlsx/defaultnumformats';

import BaseXform from '#src/xlsx/xform/base-xform';

function hashDefaultFormats() {
  const hash: any = {};
  _.each(defaultNumFormats, (dnf: any, id: any) => {
    if (dnf.f) {
      hash[dnf.f] = parseInt(id, 10);
    }
    // at some point, add the other cultures here...
  });
  return hash;
}
const defaultFmtHash: any = hashDefaultFormats();

import utils from '#src/utils/helpers/utils';

// NumFmt encapsulates translation between number format and xlsx
class NumFmtXform extends BaseXform {
  static getDefaultFmtId: any;
  static getDefaultFmtCode: any;
  id: any;
  formatCode: any;

  constructor(id?: any, formatCode?: any) {
    super();

    this.id = id;
    this.formatCode = formatCode;
  }

  get tag() {
    return 'numFmt';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode('numFmt', { numFmtId: model.id, formatCode: model.formatCode });
  }

  parseOpen(node: any) {
    switch (node.name) {
      case 'numFmt':
        this.model = {
          id: parseInt(node.attributes.numFmtId, 10),
          formatCode: utils.xmlDecode(node.attributes.formatCode).replace(/[\\](.)/g, '$1'),
        };
        return true;
      default:
        return false;
    }
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

NumFmtXform.getDefaultFmtId = function getDefaultFmtId(formatCode: any) {
  return defaultFmtHash[formatCode];
};

NumFmtXform.getDefaultFmtCode = function getDefaultFmtCode(numFmtId: any) {
  const dnf = (defaultNumFormats as any)[numFmtId];
  return dnf && dnf.f;
};

export default NumFmtXform;
