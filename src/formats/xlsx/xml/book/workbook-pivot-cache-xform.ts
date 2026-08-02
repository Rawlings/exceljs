import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface WorkbookPivotCacheModel {
  cacheId: string | number;
  rId?: string;
}

class WorkbookPivotCacheXform extends BaseXform {
  override render(xmlStream: XmlStream, model: WorkbookPivotCacheModel) {
    xmlStream.leafNode('pivotCache', {
      cacheId: model.cacheId,
      'r:id': model.rId,
    });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'pivotCache') {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        cacheId: attrs.cacheId,
        rId: attrs['r:id'],
      } as WorkbookPivotCacheModel;
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default WorkbookPivotCacheXform;
