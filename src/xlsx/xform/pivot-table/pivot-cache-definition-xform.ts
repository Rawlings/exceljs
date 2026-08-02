import BaseXform from '#src/xlsx/xform/base-xform';
import CacheField from '#src/xlsx/xform/pivot-table/cache-field';
import XmlStream from '#src/utils/xml-stream';

class PivotCacheDefinitionXform extends BaseXform {
  static PIVOT_CACHE_DEFINITION_ATTRIBUTES: any;

  constructor() {
    super();

    this.map = {};
  }

  prepare(model: any) {
    // TK
  }

  get tag() {
    // http://www.datypic.com/sc/ooxml/e-ssml_pivotCacheDefinition.html
    return 'pivotCacheDefinition';
  }

  render(xmlStream: any, model: any) {
    const { sourceSheet, cacheFields } = model;

    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, {
      ...PivotCacheDefinitionXform.PIVOT_CACHE_DEFINITION_ATTRIBUTES,
      'r:id': 'rId1',
      refreshOnLoad: '1', // important for our implementation to work
      refreshedBy: 'Author',
      refreshedDate: '45125.026046874998',
      createdVersion: '8',
      refreshedVersion: '8',
      minRefreshableVersion: '3',
      recordCount: cacheFields.length + 1,
    });

    xmlStream.openNode('cacheSource', { type: 'worksheet' });
    xmlStream.leafNode('worksheetSource', {
      ref: sourceSheet.dimensions.shortRange,
      sheet: sourceSheet.name,
    });
    xmlStream.closeNode();

    xmlStream.openNode('cacheFields', { count: cacheFields.length });
    // Note: keeping this pretty-printed for now to ease debugging.
    xmlStream.writeXml(
      cacheFields.map((cacheField: any) => new CacheField(cacheField).render()).join('\n    ')
    );
    xmlStream.closeNode();

    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    // TK
  }

  parseText(text: any) {
    // TK
  }

  parseClose(name: any) {
    // TK
  }

  reconcile(model: any, options: any) {
    // TK
  }
}

PivotCacheDefinitionXform.PIVOT_CACHE_DEFINITION_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'xr',
  'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision',
};

export default PivotCacheDefinitionXform;
