import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

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
      };
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
