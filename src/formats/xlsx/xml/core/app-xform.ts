import XmlStream from '#src/utils/stream/xml-stream';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import StringXform from '#src/formats/xlsx/xml/simple/string-xform';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

import AppHeadingPairsXform from '#src/formats/xlsx/xml/core/app-heading-pairs-xform';
import AppTitleOfPartsXform from '#src/formats/xlsx/xml/core/app-titles-of-parts-xform';

export interface AppModel {
  worksheets: { name: string }[];
  company?: string;
  manager?: string;
}

class AppXform extends BaseXform {
  static PROPERTY_ATTRIBUTES: Record<string, string>;
  static DateFormat: (dt: unknown) => string;
  static DateAttrs: Record<string, string>;
  override map: {
    Company: StringXform;
    Manager: StringXform;
    HeadingPairs: AppHeadingPairsXform;
    TitleOfParts: AppTitleOfPartsXform;
  };

  constructor() {
    super();

    this.map = {
      Company: new StringXform({ tag: 'Company' }),
      Manager: new StringXform({ tag: 'Manager' }),
      HeadingPairs: new AppHeadingPairsXform(),
      TitleOfParts: new AppTitleOfPartsXform(),
    };
  }

  override render(xmlStream: XmlStream, model: AppModel) {
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

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'Properties':
        return true;
      default:
        this.parser = this.map[node.name as keyof AppXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }

        // there's a lot we don't bother to parse
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

AppXform.DateFormat = function (dt: unknown) {
  return (dt as Date).toISOString().replace(/[.]\d{3,6}/, '');
};

AppXform.DateAttrs = { 'xsi:type': 'dcterms:W3CDTF' };

AppXform.PROPERTY_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties',
  'xmlns:vt': 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes',
};

export default AppXform;
