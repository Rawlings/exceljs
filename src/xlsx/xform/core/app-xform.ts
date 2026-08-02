import XmlStream from '#src/utils/stream/xml-stream';
import BaseXform from '#src/xlsx/xform/base-xform';
import StringXform from '#src/xlsx/xform/simple/string-xform';

import AppHeadingPairsXform from '#src/xlsx/xform/core/app-heading-pairs-xform';
import AppTitleOfPartsXform from '#src/xlsx/xform/core/app-titles-of-parts-xform';

class AppXform extends BaseXform {
  static PROPERTY_ATTRIBUTES: any;
  static DateFormat: any;
  static DateAttrs: any;

  constructor() {
    super();

    this.map = {
      Company: new StringXform({ tag: 'Company' }),
      Manager: new StringXform({ tag: 'Manager' }),
      HeadingPairs: new AppHeadingPairsXform(),
      TitleOfParts: new AppTitleOfPartsXform(),
    };
  }

  render(xmlStream: any, model: any) {
    xmlStream.openXml(XmlStream.StdDocAttributes);

    xmlStream.openNode('Properties', AppXform.PROPERTY_ATTRIBUTES);

    xmlStream.leafNode('Application', undefined, 'Microsoft Excel');
    xmlStream.leafNode('DocSecurity', undefined, '0');
    xmlStream.leafNode('ScaleCrop', undefined, 'false');

    this.map.HeadingPairs.render(xmlStream, model.worksheets);
    this.map.TitleOfParts.render(xmlStream, model.worksheets);
    this.map.Company.render(xmlStream, model.company || '');
    this.map.Manager.render(xmlStream, model.manager);

    xmlStream.leafNode('LinksUpToDate', undefined, 'false');
    xmlStream.leafNode('SharedDoc', undefined, 'false');
    xmlStream.leafNode('HyperlinksChanged', undefined, 'false');
    xmlStream.leafNode('AppVersion', undefined, '16.0300');

    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'Properties':
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }

        // there's a lot we don't bother to parse
        return false;
    }
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case 'Properties':
        this.model = {
          worksheets: this.map.TitleOfParts.model,
          company: this.map.Company.model,
          manager: this.map.Manager.model,
        };
        return false;
      default:
        return true;
    }
  }
}

AppXform.DateFormat = function (dt: any) {
  return dt.toISOString().replace(/[.]\d{3,6}/, '');
};

AppXform.DateAttrs = { 'xsi:type': 'dcterms:W3CDTF' };

AppXform.PROPERTY_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties',
  'xmlns:vt': 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes',
};

export default AppXform;
