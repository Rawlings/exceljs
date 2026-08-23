import utils from '../utils/helpers/utils';
import type { WorksheetLike } from './internal-types';

export interface PivotTableModel {
  name?: string;
  sourceSheet: WorksheetLike;
  rows: string[];
  columns: string[];
  values: string[];
  metric?: string;
}

export interface CacheField {
  name: string;
  sharedItems: unknown[] | null;
}

function makePivotTable(worksheet: WorksheetLike, model: PivotTableModel) {
  validate(worksheet, model);

  const { sourceSheet } = model;
  const rows = [...model.rows];
  const columns = [...model.columns];
  const values = [...model.values];

  const cacheFields = makeCacheFields(sourceSheet, [...rows, ...columns]);

  const nameToIndex = cacheFields.reduce((result: Record<string, number>, cacheField, index) => {
    result[cacheField.name] = index;
    return result;
  }, {});

  const rowIndices = rows.map((row) => nameToIndex[row]);
  const columnIndices = columns.map((column) => nameToIndex[column]);
  const valueIndices = values.map((value) => nameToIndex[value]);

  return {
    sourceSheet,
    rows: rowIndices,
    columns: columnIndices,
    values: valueIndices,
    metric: 'sum',
    cacheFields,
    cacheId: '10',
  };
}

function validate(worksheet: WorksheetLike, model: PivotTableModel) {
  if (worksheet.workbook?.pivotTables?.length === 1) {
    throw new Error(
      'A pivot table was already added. At this time, ExcelJS supports at most one pivot table per file.',
    );
  }

  if (model.metric && model.metric !== 'sum') {
    throw new Error('Only the "sum" metric is supported at this time.');
  }

  const rowValues = model.sourceSheet.getRow?.(1)?.values;
  const headerValues = Array.isArray(rowValues) ? rowValues.slice(1) : [];
  const headerNames = headerValues.map((v) =>
    typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : '',
  );
  const isInHeaderNames = utils.objectFromProps(headerNames, true);
  for (const name of [...model.rows, ...model.columns, ...model.values]) {
    if (!isInHeaderNames[name]) {
      throw new Error(
        `The header name "${name}" was not found in ${model.sourceSheet.name ?? 'worksheet'}.`,
      );
    }
  }

  if (!model.rows.length) {
    throw new Error('No pivot table rows specified.');
  }

  if (!model.columns.length) {
    throw new Error('No pivot table columns specified.');
  }

  if (model.values.length !== 1) {
    throw new Error('Exactly 1 value needs to be specified at this time.');
  }
}

function makeCacheFields(
  worksheet: WorksheetLike,
  fieldNamesWithSharedItems: string[],
): CacheField[] {
  const rowValues = worksheet.getRow?.(1)?.values;
  const names: unknown[] = Array.isArray(rowValues) ? rowValues : [];
  const nameToHasSharedItems = utils.objectFromProps(fieldNamesWithSharedItems, true);

  const aggregate = (columnIndex: number): unknown[] => {
    const rawValues = worksheet.getColumn?.(columnIndex)?.values;
    const columnValues: unknown[] = Array.isArray(rawValues) ? rawValues.slice(2) : [];
    const columnValuesAsSet = new Set(columnValues);
    return utils.toSortedArray(columnValuesAsSet);
  };

  // make result
  const result: CacheField[] = [];
  for (const columnIndex of utils.range(1, names.length)) {
    const name = names[columnIndex];
    const nameStr =
      typeof name === 'string'
        ? name
        : typeof name === 'number' || typeof name === 'boolean'
          ? String(name)
          : '';
    const sharedItems = nameToHasSharedItems[nameStr] ? aggregate(columnIndex) : null;
    result.push({ name: nameStr, sharedItems });
  }
  return result;
}

export { makePivotTable };
export default { makePivotTable };
