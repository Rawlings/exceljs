import _ from '../../../../utils/helpers/under-dash';

import colCache from '../../../../utils/data/col-cache';
import XmlStream from '../../../../utils/stream/xml-stream';

import BaseXform from '../base-xform';
import StaticXform from '../static-xform';
import ListXform from '../list-xform';
import DefinedNameXform from './defined-name-xform';
import SheetXform from './sheet-xform';
import WorkbookViewXform from './workbook-view-xform';
import type { WorkbookViewModel } from './workbook-view-xform';
import WorkbookPropertiesXform from './workbook-properties-xform';
import type { WorkbookPropertiesModel } from './workbook-properties-xform';
import WorkbookCalcPropertiesXform from './workbook-calc-properties-xform';
import type { WorkbookCalcPropertiesModel } from './workbook-calc-properties-xform';
import WorkbookPivotCacheXform from './workbook-pivot-cache-xform';
import type { WorkbookPivotCacheModel } from './workbook-pivot-cache-xform';
import type { SaxNode } from '../base-xform';

interface SheetPageSetup {
  printArea?: string;
  printTitlesRow?: string;
  printTitlesColumn?: string;
  [key: string]: unknown;
}

interface SheetItem {
  name: string;
  id?: unknown;
  rId?: string;
  state?: unknown;
  pageSetup?: SheetPageSetup;
  [key: string]: unknown;
}

interface DefinedNameItem {
  name: string;
  ranges: string[];
  localSheetId?: number;
  [key: string]: unknown;
}

interface MediaItem {
  type: string;
  name?: string;
  index?: number;
  [key: string]: unknown;
}

interface WorksheetItem {
  name?: unknown;
  id?: unknown;
  state?: unknown;
  pageSetup?: SheetPageSetup;
  [key: string]: unknown;
}

// This is the assembled workbook-level slice of the model as it flows
// through prepare/render/reconcile — a working superset of the public
// WorkbookModel, same reasoning as ParseWorkbookModel in xlsx.ts.
interface WorkbookXformModel {
  [key: string]: unknown;
  sheets?: SheetItem[];
  worksheets?: WorksheetItem[];
  properties?: WorkbookPropertiesModel;
  views?: WorkbookViewModel[];
  calcProperties?: WorkbookCalcPropertiesModel;
  definedNames?: DefinedNameItem[];
  pivotTables?: WorkbookPivotCacheModel[];
  media?: MediaItem[];
  worksheetHash?: Record<string, WorksheetItem>;
  workbookRels?: Array<{ Id: string; Target: string }>;
}

class WorkbookXform extends BaseXform {
  static STATIC_XFORMS: Record<string, StaticXform>;
  static WORKBOOK_ATTRIBUTES: Record<string, string>;
  override map: {
    fileVersion: StaticXform;
    workbookPr: WorkbookPropertiesXform;
    bookViews: ListXform;
    sheets: ListXform;
    definedNames: ListXform;
    calcPr: WorkbookCalcPropertiesXform;
    pivotCaches: ListXform;
  };

  constructor() {
    super();

    this.map = {
      fileVersion: WorkbookXform.STATIC_XFORMS.fileVersion,
      workbookPr: new WorkbookPropertiesXform(),
      bookViews: new ListXform({
        tag: 'bookViews',
        count: false,
        childXform: new WorkbookViewXform(),
      }),
      sheets: new ListXform({ tag: 'sheets', count: false, childXform: new SheetXform() }),
      definedNames: new ListXform({
        tag: 'definedNames',
        count: false,
        childXform: new DefinedNameXform(),
      }),
      calcPr: new WorkbookCalcPropertiesXform(),
      pivotCaches: new ListXform({
        tag: 'pivotCaches',
        count: false,
        childXform: new WorkbookPivotCacheXform(),
      }),
    };
  }

  override prepare(model: WorkbookXformModel) {
    model.sheets = model.worksheets as SheetItem[];

    // collate all the print areas from all of the sheets and add them to the defined names
    const printAreas: DefinedNameItem[] = [];
    let index = 0; // sheets is sparse array - calc index manually
    (model.sheets || []).forEach((sheet) => {
      if (sheet.pageSetup && sheet.pageSetup.printArea) {
        sheet.pageSetup.printArea.split('&&').forEach((printArea: string) => {
          const printAreaComponents = printArea.split(':');
          const definedName = {
            name: '_xlnm.Print_Area',
            ranges: [`'${sheet.name}'!$${printAreaComponents[0]}:$${printAreaComponents[1]}`],
            localSheetId: index,
          };
          printAreas.push(definedName);
        });
      }

      if (
        sheet.pageSetup &&
        (sheet.pageSetup.printTitlesRow || sheet.pageSetup.printTitlesColumn)
      ) {
        const ranges: string[] = [];

        if (sheet.pageSetup.printTitlesColumn) {
          const titlesColumns = sheet.pageSetup.printTitlesColumn.split(':');
          ranges.push(`'${sheet.name}'!$${titlesColumns[0]}:$${titlesColumns[1]}`);
        }

        if (sheet.pageSetup.printTitlesRow) {
          const titlesRows = sheet.pageSetup.printTitlesRow.split(':');
          ranges.push(`'${sheet.name}'!$${titlesRows[0]}:$${titlesRows[1]}`);
        }

        const definedName = {
          name: '_xlnm.Print_Titles',
          ranges,
          localSheetId: index,
        };

        printAreas.push(definedName);
      }
      index++;
    });
    if (printAreas.length) {
      model.definedNames = (model.definedNames || []).concat(printAreas);
    }

    (model.media || []).forEach((medium, i: number) => {
      // assign name
      medium.name = medium.type + (i + 1);
    });
  }

  override render(xmlStream: XmlStream, model: WorkbookXformModel) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('workbook', WorkbookXform.WORKBOOK_ATTRIBUTES);

    this.map.fileVersion.render(xmlStream);
    this.map.workbookPr.render(xmlStream, model.properties as WorkbookPropertiesModel);
    this.map.bookViews.render(xmlStream, model.views);
    this.map.sheets.render(xmlStream, model.sheets);
    this.map.definedNames.render(xmlStream, model.definedNames);
    this.map.calcPr.render(xmlStream, model.calcProperties as WorkbookCalcPropertiesModel);
    this.map.pivotCaches.render(xmlStream, model.pivotTables);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'workbook':
        return true;
      default:
        this.parser = this.map[node.name as keyof WorkbookXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        return true;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case 'workbook': {
        const model: WorkbookXformModel = {
          sheets: this.map.sheets.model,
          properties: this.map.workbookPr.model || {},
          views: this.map.bookViews.model,
          calcProperties: this.map.calcPr.model || {},
        };
        if (this.map.definedNames.model) {
          model.definedNames = this.map.definedNames.model;
        }
        this.model = model;

        return false;
      }
      default:
        // not quite sure how we get here!
        return true;
    }
  }

  override reconcile(model: WorkbookXformModel) {
    const rels = (model.workbookRels || []).reduce<Record<string, { Id: string; Target: string }>>(
      (map, rel) => {
        map[rel.Id] = rel;
        return map;
      },
      {}
    );

    // reconcile sheet ids, rIds and names
    const worksheets: WorksheetItem[] = [];
    let worksheet: WorksheetItem;
    let index = 0;

    (model.sheets || []).forEach((sheet) => {
      const rel = sheet.rId ? rels[sheet.rId] : undefined;
      if (!rel) {
        return;
      }
      // if rel.Target start with `[space]/xl/` or `/xl/` , then it will be replaced with `''` and spliced behind `xl/`,
      // otherwise it will be spliced directly behind `xl/`. i.g.
      worksheet = (model.worksheetHash || {})[
        `xl/${rel.Target.replace(/^(\s|\/xl\/)+/, '')}`
      ];
      // If there are "chartsheets" in the file, rel.Target will
      // come out as chartsheets/sheet1.xml or similar here, and
      // that won't be in model.worksheetHash.
      // As we don't have the infrastructure to support chartsheets,
      // we will ignore them for now:
      if (worksheet) {
        worksheet.name = sheet.name;
        worksheet.id = sheet.id;
        worksheet.state = sheet.state;
        worksheets[index++] = worksheet;
      }
    });
    model.worksheets = worksheets;

    // reconcile print areas
    const definedNames: DefinedNameItem[] = [];
    _.each(model.definedNames, (definedName: DefinedNameItem) => {
      if (definedName.name === '_xlnm.Print_Area') {
        worksheet = worksheets[definedName.localSheetId as number];
        if (worksheet) {
          if (!worksheet.pageSetup) {
            worksheet.pageSetup = {};
          }
          const range = colCache.decodeEx(definedName.ranges[0]) as { dimensions: string };
          worksheet.pageSetup.printArea = worksheet.pageSetup.printArea
            ? `${worksheet.pageSetup.printArea}&&${range.dimensions}`
            : range.dimensions;
        }
      } else if (definedName.name === '_xlnm.Print_Titles') {
        worksheet = worksheets[definedName.localSheetId as number];
        if (worksheet) {
          if (!worksheet.pageSetup) {
            worksheet.pageSetup = {};
          }

          const rangeString = definedName.ranges.join(',');

          const dollarRegex = /\$/g;

          const rowRangeRegex = /\$?\d+:\$?\d+/;
          const rowRangeMatches = rangeString.match(rowRangeRegex);

          if (rowRangeMatches && rowRangeMatches.length) {
            const range = rowRangeMatches[0];
            worksheet.pageSetup.printTitlesRow = range.replace(dollarRegex, '');
          }

          const columnRangeRegex = /\$?[A-Z]+:\$?[A-Z]+/;
          const columnRangeMatches = rangeString.match(columnRangeRegex);

          if (columnRangeMatches && columnRangeMatches.length) {
            const range = columnRangeMatches[0];
            worksheet.pageSetup.printTitlesColumn = range.replace(dollarRegex, '');
          }
        }
      } else {
        definedNames.push(definedName);
      }
    });
    model.definedNames = definedNames;

    // used by sheets to build their image models
    (model.media as MediaItem[]).forEach((media, i: number) => {
      media.index = i;
    });
  }
}

WorkbookXform.WORKBOOK_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'x15',
  'xmlns:x15': 'http://schemas.microsoft.com/office/spreadsheetml/2010/11/main',
};
WorkbookXform.STATIC_XFORMS = {
  fileVersion: new StaticXform({
    tag: 'fileVersion',
    $: { appName: 'xl', lastEdited: 5, lowestEdited: 5, rupBuild: 9303 },
  }),
};

export default WorkbookXform;
