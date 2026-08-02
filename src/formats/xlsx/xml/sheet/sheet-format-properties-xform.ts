import _ from '#src/utils/helpers/under-dash';
import BaseXform from '#src/formats/xlsx/xml/base-xform';

class SheetFormatPropertiesXform extends BaseXform {
  get tag() {
    return 'sheetFormatPr';
  }

  render(xmlStream: any, model: any) {
    if (model) {
      const attributes: any = {
        defaultRowHeight: model.defaultRowHeight,
        defaultColWidth: model.defaultColWidth,
        customHeight: !model.defaultRowHeight || model.defaultRowHeight !== 15 ? '1' : undefined,
        outlineLevelRow: model.outlineLevelRow,
        outlineLevelCol: model.outlineLevelCol,
        'x14ac:dyDescent': model.dyDescent,
      };

      if (_.some(attributes, (value: any) => value !== undefined)) {
        xmlStream.leafNode('sheetFormatPr', attributes);
      }
    }
  }

  parseOpen(node: any) {
    if (node.name === 'sheetFormatPr') {
      this.model = {
        defaultRowHeight: parseFloat(node.attributes.defaultRowHeight || '0'),
        dyDescent: parseFloat(node.attributes['x14ac:dyDescent'] || '0'),
        outlineLevelRow: parseInt(node.attributes.outlineLevelRow || '0', 10),
        outlineLevelCol: parseInt(node.attributes.outlineLevelCol || '0', 10),
      };
      if (node.attributes.defaultColWidth) {
        this.model.defaultColWidth = parseFloat(node.attributes.defaultColWidth);
      }
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default SheetFormatPropertiesXform;
