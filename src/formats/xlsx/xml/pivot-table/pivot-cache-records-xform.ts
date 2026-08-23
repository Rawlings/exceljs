import XmlStream from '../../../../utils/stream/xml-stream';

import BaseXform from '../base-xform';
import type { SaxNode } from '../base-xform';
import type { CacheFieldOptions } from './cache-field';

export interface PivotCacheRecordsModel {
  sourceSheet: {
    getSheetValues(): unknown[][];
  };
  cacheFields: CacheFieldOptions[];
}

function renderCell(value: unknown, sharedItems: string[] | null): string {
  // no shared items
  if (sharedItems === null) {
    if (Number.isFinite(value)) {
      return `<n v="${value}" />`;
    }
    return `<s v="${value}" />`;
  }

  // shared items
  const sharedItemsIndex = sharedItems.indexOf(value as string);
  if (sharedItemsIndex < 0) {
    throw new Error(`${JSON.stringify(value)} not in sharedItems ${JSON.stringify(sharedItems)}`);
  }
  return `<x v="${sharedItemsIndex}" />`;
}

function* renderRowLines(row: unknown[], cacheFields: CacheFieldOptions[]): Generator<string> {
  yield '\n  <r>';
  for (const [index, cellValue] of row.entries()) {
    yield '\n    ';
    yield renderCell(cellValue, cacheFields[index].sharedItems);
  }
  yield '\n  </r>';
}

function renderTable(sourceBodyRows: unknown[][], cacheFields: CacheFieldOptions[]): string {
  const rowsInXML = sourceBodyRows.map((row: unknown[]) => {
    const realRow = row.slice(1);
    return [...renderRowLines(realRow, cacheFields)].join('');
  });
  return rowsInXML.join('');
}

class PivotCacheRecordsXform extends BaseXform {
  static PIVOT_CACHE_RECORDS_ATTRIBUTES: Record<string, string>;

  constructor() {
    super();

    this.map = {};
  }

  override prepare(_model?: PivotCacheRecordsModel) {
    // TK
  }

  override get tag() {
    // http://www.datypic.com/sc/ooxml/e-ssml_pivotCacheRecords.html
    return 'pivotCacheRecords';
  }

  override render(xmlStream: XmlStream, model: PivotCacheRecordsModel) {
    const { sourceSheet, cacheFields } = model;
    const sourceBodyRows = sourceSheet.getSheetValues().slice(2);

    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode(this.tag, {
      ...PivotCacheRecordsXform.PIVOT_CACHE_RECORDS_ATTRIBUTES,
      count: sourceBodyRows.length,
    });
    xmlStream.writeXml(renderTable(sourceBodyRows, cacheFields));
    xmlStream.closeNode();
  }

  override parseOpen(_node?: SaxNode) {
    // TK
  }

  override parseText(_text?: string) {
    // TK
  }

  override parseClose(_name?: string) {
    // TK
  }

  override reconcile(_model?: PivotCacheRecordsModel, _options?: unknown) {
    // TK
  }
}

PivotCacheRecordsXform.PIVOT_CACHE_RECORDS_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'xr',
  'xmlns:xr': 'http://schemas.microsoft.com/office/spreadsheetml/2014/revision',
};

export default PivotCacheRecordsXform;
