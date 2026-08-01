"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worksheet_1 = __importDefault(require("./worksheet"));
const defined_names_1 = __importDefault(require("./defined-names"));
const xlsx_1 = __importDefault(require("../xlsx/xlsx"));
const csv_1 = __importDefault(require("../csv/csv"));
// Workbook requirements
//  Load and Save from file and stream
//  Access/Add/Delete individual worksheets
//  Manage String table, Hyperlink table, etc.
//  Manage scaffolding for contained objects to write to/read from
class Workbook {
    category;
    company;
    created;
    description;
    keywords;
    manager;
    modified;
    properties;
    calcProperties;
    _worksheets;
    subject;
    title;
    views;
    media;
    pivotTables;
    _definedNames;
    _xlsx;
    _csv;
    creator;
    lastModifiedBy;
    lastPrinted;
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
        this._definedNames = new defined_names_1.default();
    }
    get xlsx() {
        if (!this._xlsx)
            this._xlsx = new xlsx_1.default(this);
        return this._xlsx;
    }
    get csv() {
        if (!this._csv)
            this._csv = new csv_1.default(this);
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
    addWorksheet(name, options) {
        const id = this.nextId;
        // if options is a color, call it tabColor (and signal deprecated message)
        if (options) {
            if (typeof options === 'string') {
                // eslint-disable-next-line no-console
                console.trace('tabColor argument is now deprecated. Please use workbook.addWorksheet(name, {properties: { tabColor: { argb: "rbg value" } }');
                options = {
                    properties: {
                        tabColor: { argb: options },
                    },
                };
            }
            else if (options.argb || options.theme || options.indexed) {
                // eslint-disable-next-line no-console
                console.trace('tabColor argument is now deprecated. Please use workbook.addWorksheet(name, {properties: { tabColor: { ... } }');
                options = {
                    properties: {
                        tabColor: options,
                    },
                };
            }
        }
        const lastOrderNo = this._worksheets.reduce((acc, ws) => ((ws && ws.orderNo) > acc ? ws.orderNo : acc), 0);
        const worksheetOptions = Object.assign({}, options, {
            id,
            name,
            orderNo: lastOrderNo + 1,
            workbook: this,
        });
        const worksheet = new worksheet_1.default(worksheetOptions);
        this._worksheets[id] = worksheet;
        return worksheet;
    }
    removeWorksheetEx(worksheet) {
        delete this._worksheets[worksheet.id];
    }
    removeWorksheet(id) {
        const worksheet = this.getWorksheet(id);
        if (worksheet) {
            worksheet.destroy();
        }
    }
    getWorksheet(id) {
        if (id === undefined) {
            return this._worksheets.find(Boolean);
        }
        if (typeof id === 'number') {
            return this._worksheets[id];
        }
        if (typeof id === 'string') {
            return this._worksheets.find((worksheet) => worksheet && worksheet.name === id);
        }
        return undefined;
    }
    get worksheets() {
        // return a clone of _worksheets
        return this._worksheets
            .slice(1)
            .sort((a, b) => a.orderNo - b.orderNo)
            .filter(Boolean);
    }
    eachSheet(iteratee) {
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
    addImage(image) {
        // TODO:  validation?
        const id = this.media.length;
        this.media.push(Object.assign({}, image, { type: 'image' }));
        return id;
    }
    getImage(id) {
        return this.media[id];
    }
    get model() {
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
    set model(value) {
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
        value.worksheets.forEach((worksheetModel) => {
            const { id, name, state } = worksheetModel;
            const orderNo = value.sheets && value.sheets.findIndex((ws) => ws.id === id);
            const worksheet = (this._worksheets[id] = new worksheet_1.default({
                id,
                name,
                orderNo,
                state,
                workbook: this,
            }));
            worksheet.model = worksheetModel;
        });
        this._definedNames.model = value.definedNames;
        this.views = value.views;
        this._themes = value.themes;
        this.media = value.media || [];
        this.pivotTables = value.pivotTables || [];
    }
}
exports.default = Workbook;
