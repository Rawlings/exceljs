import XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

import BaseXform from '../base-xform';
import ListXform from '../list-xform';

import AutoFilterXform, { type AutoFilterModel } from './auto-filter-xform';
import TableColumnXform, { type TableColumnModel } from './table-column-xform';
import TableStyleInfoXform, { type TableStyleInfoModel } from './table-style-info-xform';

export interface TableModel {
  id?: unknown;
  name: string;
  displayName?: string;
  tableRef?: string;
  ref?: string;
  autoFilterRef?: string;
  totalsRow?: boolean;
  headerRow?: boolean;
  columns: TableColumnModel[];
  style?: TableStyleInfoModel;
}

class TableXform extends BaseXform {
  static TABLE_ATTRIBUTES: Record<string, string>;

  constructor() {
    super();

    this.map = {
      autoFilter: new AutoFilterXform(),
      tableColumns: new ListXform({
        tag: 'tableColumns',
        count: true,
        empty: true,
        childXform: new TableColumnXform(),
      }),
      tableStyleInfo: new TableStyleInfoXform(),
    };
  }

  override prepare(model: TableModel, options: any) {
    this.map.autoFilter.prepare(model);
    this.map.tableColumns.prepare(model.columns, options);
  }

  override get tag() {
    return 'table';
  }

  override render(xmlStream: XmlStream, model: TableModel) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag as string, {
      ...TableXform.TABLE_ATTRIBUTES,
      id: model.id,
      name: model.name,
      displayName: model.displayName || model.name,
      ref: model.tableRef,
      totalsRowCount: model.totalsRow ? '1' : undefined,
      totalsRowShown: model.totalsRow ? undefined : '1',
      headerRowCount: model.headerRow ? '1' : '0',
    });

    this.map.autoFilter.render(xmlStream, model);
    this.map.tableColumns.render(xmlStream, model.columns);
    this.map.tableStyleInfo.render(xmlStream, model.style);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    const { name } = node;
    const attributes = node.attributes as Record<string, string>;
    switch (name) {
      case this.tag:
        this.reset();
        this.model = {
          name: attributes.name,
          displayName: attributes.displayName || attributes.name,
          tableRef: attributes.ref,
          ref: attributes.ref,
          totalsRow: attributes.totalsRowCount === '1',
          headerRow: attributes.headerRowCount === '1',
        };
        break;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name?: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag: {
        const model = this.model as TableModel;
        model.columns = this.map.tableColumns.model;
        if (this.map.autoFilter.model) {
          const autoFilterModel = this.map.autoFilter.model as AutoFilterModel;
          model.autoFilterRef = autoFilterModel.autoFilterRef;
          autoFilterModel.columns.forEach((column, index) => {
            model.columns[index].filterButton = column.filterButton;
          });
        }
        model.style = this.map.tableStyleInfo.model;
        return false;
      }
      default:
        // could be some unrecognised tags
        return true;
    }
  }

  override reconcile(model: TableModel, options: any) {
    // fetch the dfxs from styles
    model.columns.forEach((column) => {
      if (column.dxfId !== undefined) {
        column.style = options.styles.getDxfStyle(column.dxfId);
      }
    });
  }
}

TableXform.TABLE_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'xr xr3',
  'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision',
  'xmlns:xr3': 'http://schemas.microsoft.com/office/spreadsheetml/2016/revision3',
  // 'xr:uid': '{00000000-000C-0000-FFFF-FFFF00000000}',
};

export default TableXform;
