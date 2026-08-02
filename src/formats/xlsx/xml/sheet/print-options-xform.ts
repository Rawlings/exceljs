import _ from '#src/utils/helpers/under-dash';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface PrintOptionsModel {
  showRowColHeaders?: boolean;
  showGridLines?: boolean;
  horizontalCentered?: boolean;
  verticalCentered?: boolean;
}

function booleanToXml(model: unknown) {
  return model ? '1' : undefined;
}

class PrintOptionsXform extends BaseXform {
  override get tag() {
    return 'printOptions';
  }

  override render(xmlStream: XmlStream, model: PrintOptionsModel | undefined) {
    if (model) {
      const attributes = {
        headings: booleanToXml(model.showRowColHeaders),
        gridLines: booleanToXml(model.showGridLines),
        horizontalCentered: booleanToXml(model.horizontalCentered),
        verticalCentered: booleanToXml(model.verticalCentered),
      };
      if (_.some(attributes, (value) => value !== undefined)) {
        xmlStream.leafNode(this.tag as string, attributes);
      }
    }
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag: {
        const attrs = node.attributes as Record<string, string>;
        this.model = {
          showRowColHeaders: attrs.headings === '1',
          showGridLines: attrs.gridLines === '1',
          horizontalCentered: attrs.horizontalCentered === '1',
          verticalCentered: attrs.verticalCentered === '1',
        };
        return true;
      }
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default PrintOptionsXform;
