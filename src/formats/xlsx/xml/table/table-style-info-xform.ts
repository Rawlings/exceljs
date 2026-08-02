import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface TableStyleInfoModel {
  theme?: string | null;
  showFirstColumn: boolean;
  showLastColumn: boolean;
  showRowStripes: boolean;
  showColumnStripes: boolean;
}

class TableStyleInfoXform extends BaseXform {
  override get tag() {
    return 'tableStyleInfo';
  }

  override render(xmlStream: XmlStream, model: TableStyleInfoModel) {
    xmlStream.leafNode(this.tag as string, {
      name: model.theme ? model.theme : undefined,
      showFirstColumn: model.showFirstColumn ? '1' : '0',
      showLastColumn: model.showLastColumn ? '1' : '0',
      showRowStripes: model.showRowStripes ? '1' : '0',
      showColumnStripes: model.showColumnStripes ? '1' : '0',
    });
    return true;
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        theme: attrs.name ? attrs.name : null,
        showFirstColumn: attrs.showFirstColumn === '1',
        showLastColumn: attrs.showLastColumn === '1',
        showRowStripes: attrs.showRowStripes === '1',
        showColumnStripes: attrs.showColumnStripes === '1',
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

export default TableStyleInfoXform;
