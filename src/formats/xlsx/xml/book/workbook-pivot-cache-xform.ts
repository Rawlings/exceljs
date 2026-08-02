import BaseXform from '#src/formats/xlsx/xml/base-xform';

class WorkbookPivotCacheXform extends BaseXform {
  render(xmlStream: any, model: any) {
    xmlStream.leafNode('pivotCache', {
      cacheId: model.cacheId,
      'r:id': model.rId,
    });
  }

  parseOpen(node: any) {
    if (node.name === 'pivotCache') {
      this.model = {
        cacheId: node.attributes.cacheId,
        rId: node.attributes['r:id'],
      };
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default WorkbookPivotCacheXform;
