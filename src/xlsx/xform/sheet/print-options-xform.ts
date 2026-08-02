import _ from '#src/utils/under-dash';
import BaseXform from '#src/xlsx/xform/base-xform';

function booleanToXml(model: any) {
  return model ? '1' : undefined;
}

class PrintOptionsXform extends BaseXform {
  get tag() {
    return 'printOptions';
  }

  render(xmlStream: any, model: any) {
    if (model) {
      const attributes = {
        headings: booleanToXml(model.showRowColHeaders),
        gridLines: booleanToXml(model.showGridLines),
        horizontalCentered: booleanToXml(model.horizontalCentered),
        verticalCentered: booleanToXml(model.verticalCentered),
      };
      if (_.some(attributes, (value: any) => value !== undefined)) {
        xmlStream.leafNode(this.tag, attributes);
      }
    }
  }

  parseOpen(node: any) {
    switch (node.name) {
      case this.tag:
        this.model = {
          showRowColHeaders: node.attributes.headings === '1',
          showGridLines: node.attributes.gridLines === '1',
          horizontalCentered: node.attributes.horizontalCentered === '1',
          verticalCentered: node.attributes.verticalCentered === '1',
        };
        return true;
      default:
        return false;
    }
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default PrintOptionsXform;
