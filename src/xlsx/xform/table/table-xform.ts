import XmlStream from '#src/utils/stream/xml-stream';

import BaseXform from '#src/xlsx/xform/base-xform';
import ListXform from '#src/xlsx/xform/list-xform';

import AutoFilterXform from '#src/xlsx/xform/table/auto-filter-xform';
import TableColumnXform from '#src/xlsx/xform/table/table-column-xform';
import TableStyleInfoXform from '#src/xlsx/xform/table/table-style-info-xform';

class TableXform extends BaseXform {
  static TABLE_ATTRIBUTES: any;

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

  prepare(model: any, options: any) {
    this.map.autoFilter.prepare(model);
    this.map.tableColumns.prepare(model.columns, options);
  }

  get tag() {
    return 'table';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, {
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

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    const { name, attributes } = node;
    switch (name) {
      case this.tag:
        this.reset();
        this.model = {
          name: attributes.name,
          displayName: attributes.displayName || attributes.name,
          tableRef: attributes.ref,
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

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model.columns = this.map.tableColumns.model;
        if (this.map.autoFilter.model) {
          this.model.autoFilterRef = this.map.autoFilter.model.autoFilterRef;
          this.map.autoFilter.model.columns.forEach((column: any, index: any) => {
            this.model.columns[index].filterButton = column.filterButton;
          });
        }
        this.model.style = this.map.tableStyleInfo.model;
        return false;
      default:
        // could be some unrecognised tags
        return true;
    }
  }

  reconcile(model: any, options: any) {
    // fetch the dfxs from styles
    model.columns.forEach((column: any) => {
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
