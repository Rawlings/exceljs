import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface WorkbookCalcPropertiesModel {
  fullCalcOnLoad?: boolean;
}

class WorkbookCalcPropertiesXform extends BaseXform {
  override render(xmlStream: XmlStream, model: WorkbookCalcPropertiesModel) {
    xmlStream.leafNode('calcPr', {
      calcId: 171027,
      fullCalcOnLoad: model.fullCalcOnLoad ? 1 : undefined,
    });
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'calcPr') {
      const model: WorkbookCalcPropertiesModel = {};
      if ((node.attributes as Record<string, string>).fullCalcOnLoad) {
        model.fullCalcOnLoad = true;
      }
      this.model = model;
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default WorkbookCalcPropertiesXform;
