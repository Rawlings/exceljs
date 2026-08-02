import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface WorkbookPropertiesModel {
  date1904?: boolean;
}

class WorksheetPropertiesXform extends BaseXform {
  override render(xmlStream: XmlStream, model: WorkbookPropertiesModel) {
    xmlStream.leafNode('workbookPr', {
      date1904: model.date1904 ? 1 : undefined,
      defaultThemeVersion: 164011,
      filterPrivacy: 1,
    });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'workbookPr') {
      this.model = {
        date1904: (node.attributes as Record<string, string>).date1904 === '1',
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

export default WorksheetPropertiesXform;
