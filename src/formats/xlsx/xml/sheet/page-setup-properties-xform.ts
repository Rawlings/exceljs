import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface PageSetupPropertiesModel {
  fitToPage?: boolean;
}

class PageSetupPropertiesXform extends BaseXform {
  override get tag() {
    return 'pageSetUpPr';
  }

  override render(xmlStream: XmlStream, model: PageSetupPropertiesModel | undefined) {
    if (model && model.fitToPage) {
      xmlStream.leafNode(this.tag as string, {
        fitToPage: model.fitToPage ? '1' : undefined,
      });
      return true;
    }
    return false;
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      this.model = {
        fitToPage: (node.attributes as Record<string, string>).fitToPage === '1',
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

export default PageSetupPropertiesXform;
