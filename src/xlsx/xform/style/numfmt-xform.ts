import _ from '../../../utils/under-dash';
import defaultNumFormats from '../../defaultnumformats';

import BaseXform from '../base-xform';

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
          formatCode: node.attributes.formatCode.replace(/[\\](.)/g, '$1'),
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
