import _ from '../../../../utils/helpers/under-dash';
import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface SheetFormatPropertiesModel {
  defaultRowHeight?: number;
  defaultColWidth?: number;
  outlineLevelRow?: number;
  outlineLevelCol?: number;
  dyDescent?: number;
}

class SheetFormatPropertiesXform extends BaseXform {
  override get tag() {
    return 'sheetFormatPr';
  }

  override render(xmlStream: XmlStream, model: SheetFormatPropertiesModel | undefined) {
    if (model) {
      const attributes: Record<string, unknown> = {
        defaultRowHeight: model.defaultRowHeight,
        defaultColWidth: model.defaultColWidth,
        customHeight: !model.defaultRowHeight || model.defaultRowHeight !== 15 ? '1' : undefined,
        outlineLevelRow: model.outlineLevelRow,
        outlineLevelCol: model.outlineLevelCol,
        'x14ac:dyDescent': model.dyDescent,
      };

      if (_.some(attributes, (value) => value !== undefined)) {
        xmlStream.leafNode('sheetFormatPr', attributes);
      }
    }
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'sheetFormatPr') {
      const attrs = node.attributes as Record<string, string>;
      const model: SheetFormatPropertiesModel = {
        defaultRowHeight: parseFloat(attrs.defaultRowHeight || '0'),
        dyDescent: parseFloat(attrs['x14ac:dyDescent'] || '0'),
        outlineLevelRow: parseInt(attrs.outlineLevelRow || '0', 10),
        outlineLevelCol: parseInt(attrs.outlineLevelCol || '0', 10),
      };
      if (attrs.defaultColWidth) {
        model.defaultColWidth = parseFloat(attrs.defaultColWidth);
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

export default SheetFormatPropertiesXform;
