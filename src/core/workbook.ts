import Worksheet from './worksheet';
import type { WorksheetOptions, WorksheetState } from './worksheet';
import type { ImagePayload } from './image';
import DefinedNames from './defined-names';
import XLSX from '../formats/xlsx/xlsx';
import CSV from '../formats/csv/csv';
import type { WorkbookLike, WorksheetLike } from './internal-types';

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
  lastPrinted: unknown;
  created: Date;
  modified: Date;
  properties: Partial<WorkbookProperties>;
  worksheets: Record<string, unknown>[];
  sheets: Record<string, unknown>[];
  definedNames: unknown;
  views: WorkbookView[];
  company: string;
  manager: string;
  title: string;
  subject: string;
  keywords: string;
  category: string;
  description: string;
  language: unknown;
  revision: unknown;
  contentStatus: unknown;
  themes: unknown;
  media: unknown[];
  pivotTables: unknown[];
  calcProperties: Partial<CalculationProperties>;
}

export class Workbook implements WorkbookLike {
  category: string;
  company: string;
  created: Date;
  description: string;
  keywords: string;
  manager: string;
  modified: Date;
  properties: Partial<WorkbookProperties>;
  calcProperties: Partial<CalculationProperties>;
  _worksheets: (Worksheet | undefined)[];
  subject: string;
  title: string;
  views: WorkbookView[];
  media: unknown[];
  pivotTables: unknown[];
  _definedNames: DefinedNames;
  _xlsx: XLSX | undefined;
  _csv: CSV | undefined;
  _themes: unknown;
  creator: unknown;
  lastModifiedBy: unknown;
  lastPrinted: unknown;
  language: unknown;
  revision: unknown;
  contentStatus: unknown;

  constructor() {
    this.category = '';
    this.company = '';
    this.created = new Date();
    this.description = '';
    this.keywords = '';
    this.manager = '';
    this.modified = this.created;
    this.properties = {};
    this.calcProperties = {};
    this._worksheets = [];
    this.subject = '';
    this.title = '';
    this.views = [];
    this.media = [];
    this.pivotTables = [];
    this._definedNames = new DefinedNames();
  }

  get xlsx() {
    if (!this._xlsx) this._xlsx = new XLSX(this);
    return this._xlsx;
  }

  get csv() {
    if (!this._csv) this._csv = new CSV(this);
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
          'tabColor argument is now deprecated. Please use workbook.addWorksheet(name, {properties: { tabColor: { argb: "rbg value" } }'
        );
        options = {
          properties: {
            tabColor: { argb: options },
          },
        };
      } else if (options.argb || options.theme || options.indexed) {
        // eslint-disable-next-line no-console
        console.trace(
          'tabColor argument is now deprecated. Please use workbook.addWorksheet(name, {properties: { tabColor: { ... } }'
        );
        options = {
          properties: {
            tabColor: options,
          },
        };
      }
    }

    const lastOrderNo = this._worksheets.reduce(
      (acc: number, ws) => (ws && (ws.orderNo as number) > acc ? (ws.orderNo as number) : acc),
      0
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
    delete this._worksheets[worksheet.id];
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
      return this._worksheets[id] || this._worksheets.find((ws) => ws && ws.id === id);
    }
    if (typeof id === 'string') {
      const byName = this._worksheets.find((worksheet) => worksheet && worksheet.name === id);
      if (byName) return byName;
      const num = parseInt(id, 10);
      if (!Number.isNaN(num)) {
        return this._worksheets[num] || this._worksheets.find((ws) => ws && ws.id === num);
      }
    }
    return undefined;
  }

  get worksheets() {
    // return a clone of _worksheets
    return (this._worksheets as Worksheet[])
      .slice(1)
      .sort((a, b) => (a?.orderNo as number) - (b?.orderNo as number))
      .filter(Boolean);
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

  getImage(id: number): unknown {
    return this.media[id];
  }

  get model() {
    return {
      creator: (this.creator as string) || 'Unknown',
      lastModifiedBy: (this.lastModifiedBy as string) || 'Unknown',
      lastPrinted: this.lastPrinted,
      created: this.created,
      modified: this.modified,
      properties: this.properties,
      worksheets: this.worksheets.map((worksheet) => worksheet.model) as unknown as Record<
        string,
        unknown
      >[],
      sheets: this.worksheets.map((ws) => ws.model).filter(Boolean) as unknown as Record<
        string,
        unknown
      >[],
      definedNames: (this._definedNames as unknown as { model: unknown }).model,
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
    this.calcProperties = value.calcProperties;
    this._worksheets = [];
    value.worksheets.forEach((worksheetModel: Record<string, unknown>, index: number) => {
      const id = (worksheetModel.id as number) || index + 1;
      const name = worksheetModel.name as string;
      const state = worksheetModel.state as WorksheetState;
      const orderNo = value.sheets && value.sheets.findIndex((ws) => ws.id === id);
      const worksheet = (this._worksheets[id] = new Worksheet({
        id,
        name,
        orderNo,
        state,
        workbook: this as unknown as WorkbookLike,
      }));
      (worksheet as unknown as { model: unknown }).model = worksheetModel;
    });

    (this._definedNames as unknown as { model: unknown }).model = value.definedNames;
    this.views = value.views;
    this._themes = value.themes;
    this.media = value.media || [];
    this.pivotTables = value.pivotTables || [];
  }
}

export default Workbook;
