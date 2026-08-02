import _ from '#src/utils/helpers/under-dash';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface SheetProtectionModel {
  sheet?: boolean;
  objects?: boolean;
  scenarios?: boolean;
  selectLockedCells?: boolean;
  selectUnlockedCells?: boolean;
  formatCells?: boolean;
  formatColumns?: boolean;
  formatRows?: boolean;
  insertColumns?: boolean;
  insertRows?: boolean;
  insertHyperlinks?: boolean;
  deleteColumns?: boolean;
  deleteRows?: boolean;
  sort?: boolean;
  autoFilter?: boolean;
  pivotTables?: boolean;
  algorithmName?: string;
  hashValue?: string;
  saltValue?: string;
  spinCount?: number;
}

function booleanToXml(model: unknown, value: string) {
  return model ? value : undefined;
}

function xmlToBoolean(value: unknown, equals: string) {
  return value === equals ? true : undefined;
}

class SheetProtectionXform extends BaseXform {
  override get tag() {
    return 'sheetProtection';
  }

  override render(xmlStream: XmlStream, model: SheetProtectionModel | undefined) {
    if (model) {
      const attributes: Record<string, unknown> = {};
      if (model.sheet) {
        attributes.algorithmName = model.algorithmName;
        attributes.hashValue = model.hashValue;
        attributes.saltValue = model.saltValue;
        attributes.spinCount = model.spinCount;
      }
      Object.assign(attributes, {
        sheet: booleanToXml(model.sheet, '1'),
        selectLockedCells: model.selectLockedCells === false ? '1' : undefined,
        selectUnlockedCells: model.selectUnlockedCells === false ? '1' : undefined,
        formatCells: booleanToXml(model.formatCells, '0'),
        formatColumns: booleanToXml(model.formatColumns, '0'),
        formatRows: booleanToXml(model.formatRows, '0'),
        insertColumns: booleanToXml(model.insertColumns, '0'),
        insertRows: booleanToXml(model.insertRows, '0'),
        insertHyperlinks: booleanToXml(model.insertHyperlinks, '0'),
        deleteColumns: booleanToXml(model.deleteColumns, '0'),
        deleteRows: booleanToXml(model.deleteRows, '0'),
        sort: booleanToXml(model.sort, '0'),
        autoFilter: booleanToXml(model.autoFilter, '0'),
        pivotTables: booleanToXml(model.pivotTables, '0'),
      });
      if (model.sheet) {
        attributes.objects = booleanToXml(model.objects === false, '1');
        attributes.scenarios = booleanToXml(model.scenarios === false, '1');
      }
      if (_.some(attributes, (value) => value !== undefined)) {
        xmlStream.leafNode(this.tag as string, attributes);
      }
    }
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag: {
        const attrs = node.attributes as Record<string, string>;
        const model: SheetProtectionModel = {
          sheet: xmlToBoolean(attrs.sheet, '1'),
          objects: attrs.objects === '1' ? false : undefined,
          scenarios: attrs.scenarios === '1' ? false : undefined,
          selectLockedCells: attrs.selectLockedCells === '1' ? false : undefined,
          selectUnlockedCells: attrs.selectUnlockedCells === '1' ? false : undefined,
          formatCells: xmlToBoolean(attrs.formatCells, '0'),
          formatColumns: xmlToBoolean(attrs.formatColumns, '0'),
          formatRows: xmlToBoolean(attrs.formatRows, '0'),
          insertColumns: xmlToBoolean(attrs.insertColumns, '0'),
          insertRows: xmlToBoolean(attrs.insertRows, '0'),
          insertHyperlinks: xmlToBoolean(attrs.insertHyperlinks, '0'),
          deleteColumns: xmlToBoolean(attrs.deleteColumns, '0'),
          deleteRows: xmlToBoolean(attrs.deleteRows, '0'),
          sort: xmlToBoolean(attrs.sort, '0'),
          autoFilter: xmlToBoolean(attrs.autoFilter, '0'),
          pivotTables: xmlToBoolean(attrs.pivotTables, '0'),
        };
        if (attrs.algorithmName) {
          model.algorithmName = attrs.algorithmName;
          model.hashValue = attrs.hashValue;
          model.saltValue = attrs.saltValue;
          model.spinCount = parseInt(attrs.spinCount, 10);
        }
        this.model = model;
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

export default SheetProtectionXform;
