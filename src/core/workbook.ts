import {
  Worksheet,
  type WorksheetModel,
  type WorksheetOptions,
  type WorksheetState,
} from './worksheet';
import type { ImagePayload, Image } from './image';
import { DefinedNames, type DefinedNamesModel } from './defined-names';
import { XLSX } from '../formats/xlsx/xlsx';
import { CSV } from '../formats/csv/csv';
import type { WorkbookLike, WorksheetLike } from './internal-types';

function isObjectRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isWorksheetState(val: unknown): val is WorksheetState {
  return val === 'visible' || val === 'hidden' || val === 'veryHidden';
}

// Workbook requirements
//  Load and Save from file and stream
//  Access/Add/Delete individual worksheets
//  Manage String table, Hyperlink table, etc.
//  Manage scaffolding for contained objects to write to/read from

export interface WorkbookProperties {
  date1904: boolean;
}

export interface WorkbookView {
  x: number;
  y: number;
  width: number;
  height: number;
  firstSheet: number;
  activeTab: number;
  visibility: string;
}

export interface CalculationProperties {
  fullCalcOnLoad: boolean;
}

export interface WorkbookModel {
  creator: string;
  lastModifiedBy: string;
  lastPrinted: Date;
  created: Date;
  modified: Date;
  properties: WorkbookProperties;
  worksheets: (WorksheetModel | null | Record<string, unknown>)[];
  sheets: (WorksheetModel | null | Record<string, unknown>)[];
  definedNames: DefinedNamesModel;
  views: WorkbookView[];
  company: string;
  manager: string;
  title: string;
  subject: string;
  keywords: string;
  category: string;
  description: string;
  language: string;
  revision: number | Date;
  contentStatus: string;
  themes: unknown;
  media: Image[];
  pivotTables?: unknown[];
  calcProperties?: Partial<CalculationProperties>;
}

export class Workbook implements WorkbookLike {
  category: string;
  company: string;
  creator: string;
  description: string;
  keywords: string;
  lastModifiedBy: string;
  created: Date;
  manager: string;
  modified: Date;
  lastPrinted: Date;
  properties: WorkbookProperties;
  subject: string;
  title: string;
  calcProperties: CalculationProperties;
  views: WorkbookView[];
  media: Image[];
  pivotTables: unknown[];
  _worksheets: (Worksheet | undefined)[];
  _definedNames: DefinedNames;
  _xlsx: XLSX | undefined;
  _csv: CSV | undefined;
  _themes: unknown;
  language: string;
  revision: number | Date;
  contentStatus: string;

  constructor() {
    this.category = '';
    this.company = '';
    this.creator = '';
    this.description = '';
    this.keywords = '';
    this.lastModifiedBy = '';
    this.created = new Date();
    this.manager = '';
    this.modified = this.created;
    this.lastPrinted = this.created;
    this.properties = { date1904: false };
    this.calcProperties = { fullCalcOnLoad: false };
    this.subject = '';
    this.title = '';
    this.views = [];
    this.media = [];
    this.pivotTables = [];
    this._worksheets = [];
    this._definedNames = new DefinedNames();
    this.language = '';
    this.revision = 0;
    this.contentStatus = '';
  }

  get xlsx() {
    this._xlsx ??= new XLSX(this);
    return this._xlsx;
  }

  get csv() {
    this._csv ??= new CSV(this);
    return this._csv;
  }

  get nextId() {
    // find the next unique spot to add worksheet
    for (let i = 1; i < this._worksheets.length; i++) {
      if (!this._worksheets[i]) {
        return i;
      }
    }
    return this._worksheets.length || 1;
  }

  addWorksheet(name?: string, options?: Record<string, unknown> | string): Worksheet {
    const id = this.nextId;

    // if options is a color, call it tabColor (and signal deprecated message)
    if (options) {
      if (typeof options === 'string') {
        // eslint-disable-next-line no-console
        console.trace(
          'tabColor argument is now deprecated. Please use workbook.addWorksheet(name, {properties: { tabColor: { argb: "rbg value" } }',
        );
        options = {
          properties: {
            tabColor: { argb: options },
          },
        };
      } else if (options.argb || options.theme || options.indexed) {
        // eslint-disable-next-line no-console
        console.trace(
          'tabColor argument is now deprecated. Please use workbook.addWorksheet(name, {properties: { tabColor: { ... } }',
        );
        options = {
          properties: {
            tabColor: options,
          },
        };
      }
    }

    const lastOrderNo = this._worksheets.reduce(
      (acc: number, ws) =>
        ws && typeof ws.orderNo === 'number' && ws.orderNo > acc ? ws.orderNo : acc,
      0,
    );
    const worksheetOptions: WorksheetOptions = Object.assign({}, options, {
      id,
      name,
      orderNo: lastOrderNo + 1,
      workbook: this,
    });

    const worksheet = new Worksheet(worksheetOptions);

    this._worksheets[id] = worksheet;
    return worksheet;
  }

  removeWorksheetEx(worksheet: Worksheet | WorksheetLike) {
    if (worksheet.id !== undefined) {
      const wsId = typeof worksheet.id === 'number' ? worksheet.id : parseInt(worksheet.id, 10);
      if (!Number.isNaN(wsId)) {
        this._worksheets.splice(wsId, 1);
      }
    }
  }

  removeWorksheet(id: number | string) {
    const worksheet = this.getWorksheet(id);
    if (worksheet) {
      worksheet.destroy();
    }
  }

  getWorksheet(id?: number | string): Worksheet | undefined {
    if (id === undefined) {
      return this._worksheets.find(Boolean);
    }
    if (typeof id === 'number') {
      return this._worksheets[id] ?? this._worksheets.find((ws) => ws?.id === id);
    }
    if (typeof id === 'string') {
      const byName = this._worksheets.find((worksheet) => worksheet?.name === id);
      if (byName) return byName;
      const num = parseInt(id, 10);
      if (!Number.isNaN(num)) {
        return this._worksheets[num] ?? this._worksheets.find((ws) => ws?.id === num);
      }
    }
    return undefined;
  }

  get worksheets(): Worksheet[] {
    // return a clone of _worksheets
    return this._worksheets
      .filter((ws): ws is Worksheet => Boolean(ws))
      .toSorted((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
  }

  eachSheet(iteratee: (sheet: Worksheet, id: number) => void) {
    this.worksheets.forEach((sheet) => {
      iteratee(sheet, sheet.id);
    });
  }

  get definedNames() {
    return this._definedNames;
  }

  clearThemes() {
    // Note: themes are not an exposed feature, meddle at your peril!
    this._themes = undefined;
  }

  addImage(image: ImagePayload): number {
    // TODO:  validation?
    const id = this.media.length;
    this.media.push(Object.assign({}, image, { type: 'image' }));
    return id;
  }

  getImage(id: number): Image {
    return this.media[id];
  }

  get model(): WorkbookModel {
    return {
      creator: this.creator || 'Unknown',
      lastModifiedBy: this.lastModifiedBy || 'Unknown',
      lastPrinted: this.lastPrinted,
      created: this.created,
      modified: this.modified,
      properties: this.properties,
      worksheets: this.worksheets.map((worksheet) => worksheet.model),
      sheets: this.worksheets.map((ws) => ws.model).filter(Boolean),
      definedNames: this._definedNames.model,
      views: this.views,
      company: this.company,
      manager: this.manager,
      title: this.title,
      subject: this.subject,
      keywords: this.keywords,
      category: this.category,
      description: this.description,
      language: this.language,
      revision: this.revision,
      contentStatus: this.contentStatus,
      themes: this._themes,
      media: this.media,
      pivotTables: this.pivotTables,
      calcProperties: this.calcProperties,
    };
  }

  set model(value: WorkbookModel) {
    this.creator = value.creator;
    this.lastModifiedBy = value.lastModifiedBy;
    this.lastPrinted = value.lastPrinted;
    this.created = value.created;
    this.modified = value.modified;
    this.company = value.company;
    this.manager = value.manager;
    this.title = value.title;
    this.subject = value.subject;
    this.keywords = value.keywords;
    this.category = value.category;
    this.description = value.description;
    this.language = value.language;
    this.revision = value.revision;
    this.contentStatus = value.contentStatus;

    this.properties = value.properties;
    this.calcProperties = { fullCalcOnLoad: value.calcProperties?.fullCalcOnLoad ?? false };
    this._worksheets = [];
    const sheets = value.sheets ?? (value.worksheets as typeof value.sheets) ?? [];
    (value.worksheets ?? []).forEach((worksheetModel, index) => {
      if (!isObjectRecord(worksheetModel)) return;
      const id =
        (typeof worksheetModel.id === 'number' ? worksheetModel.id : undefined) ?? index + 1;
      const name = typeof worksheetModel.name === 'string' ? worksheetModel.name : `Sheet${id}`;
      const state = isWorksheetState(worksheetModel.state) ? worksheetModel.state : undefined;
      const orderNo = Array.isArray(sheets)
        ? sheets.findIndex((ws) => isObjectRecord(ws) && ws.id === id)
        : index;
      const worksheet = (this._worksheets[id] = new Worksheet({
        id,
        name,
        orderNo: orderNo >= 0 ? orderNo : index,
        state,
        workbook: this,
      }));
      (worksheet as { model: unknown }).model = worksheetModel;
    });

    (this._definedNames as { model: unknown }).model = value.definedNames;
    this.views = value.views;
    this._themes = value.themes;
    this.media = value.media ?? [];
    this.pivotTables = value.pivotTables ?? [];
  }
}

export default Workbook;
