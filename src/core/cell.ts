import colCache from '../utils/data/col-cache';
import _ from '../utils/helpers/under-dash';
import * as Enums from './enums';
import { slideFormula } from '../utils/data/shared-formula';
import { Note } from './note';
import type { NoteModel } from './note';
import type {
  RowLike,
  ColumnLike,
  WorksheetLike,
  WorkbookLike,
  DataValidationLike,
} from './internal-types';
import type { DataValidation } from './data-validations';

export type FillPatterns =
  | 'none'
  | 'solid'
  | 'darkVertical'
  | 'darkHorizontal'
  | 'darkGrid'
  | 'darkTrellis'
  | 'darkDown'
  | 'darkUp'
  | 'lightVertical'
  | 'lightHorizontal'
  | 'lightGrid'
  | 'lightTrellis'
  | 'lightDown'
  | 'lightUp'
  | 'darkGray'
  | 'mediumGray'
  | 'lightGray'
  | 'gray125'
  | 'gray0625';

export interface Color {
  argb: string;
  theme: number;
}

export interface FillPattern {
  type: 'pattern';
  pattern: FillPatterns;
  fgColor?: Partial<Color>;
  bgColor?: Partial<Color>;
}

export interface GradientStop {
  position: number;
  color: Partial<Color>;
}

export interface FillGradientAngle {
  type: 'gradient';
  gradient: 'angle';
  degree: number;
  stops: GradientStop[];
}

export interface FillGradientPath {
  type: 'gradient';
  gradient: 'path';
  center: { left: number; top: number };
  stops: GradientStop[];
}

export type Fill = FillPattern | FillGradientAngle | FillGradientPath;

export interface Font {
  name: string;
  size: number;
  family: number;
  scheme: 'minor' | 'major' | 'none';
  charset: number;
  color: Partial<Color>;
  bold: boolean;
  italic: boolean;
  underline: boolean | 'none' | 'single' | 'double' | 'singleAccounting' | 'doubleAccounting';
  vertAlign: 'superscript' | 'subscript';
  strike: boolean;
  outline: boolean;
}

export type BorderStyle =
  | 'thin'
  | 'dotted'
  | 'hair'
  | 'medium'
  | 'double'
  | 'thick'
  | 'dashed'
  | 'dashDot'
  | 'dashDotDot'
  | 'slantDashDot'
  | 'mediumDashed'
  | 'mediumDashDotDot'
  | 'mediumDashDot';

export interface Border {
  style: BorderStyle;
  color: Partial<Color>;
}

export interface BorderDiagonal extends Border {
  up: boolean;
  down: boolean;
}

export interface Borders {
  top: Partial<Border>;
  left: Partial<Border>;
  bottom: Partial<Border>;
  right: Partial<Border>;
  diagonal: Partial<BorderDiagonal>;
}

export interface Alignment {
  horizontal: 'left' | 'center' | 'right' | 'fill' | 'justify' | 'centerContinuous' | 'distributed';
  vertical: 'top' | 'middle' | 'bottom' | 'distributed' | 'justify';
  wrapText: boolean;
  shrinkToFit: boolean;
  indent: number;
  readingOrder: 'rtl' | 'ltr';
  textRotation: number | 'vertical';
}

export interface Protection {
  locked: boolean;
  hidden: boolean;
}

export interface Style {
  numFmt: string;
  font: Partial<Font>;
  alignment: Partial<Alignment>;
  protection: Partial<Protection>;
  border: Partial<Borders>;
  fill: Fill;
}

export interface CellErrorValue {
  error: '#N/A' | '#REF!' | '#NAME?' | '#DIV/0!' | '#NULL!' | '#VALUE!' | '#NUM!';
}

export interface RichText {
  text: string;
  font?: Partial<Font>;
}

export interface CellRichTextValue {
  richText: RichText[];
}

export interface CellHyperlinkValue {
  text: string;
  hyperlink: string;
  tooltip?: string;
}

export interface CellFormulaValue {
  formula: string;
  result?: number | string | boolean | Date | CellErrorValue;
  shareType?: string;
  ref?: string;
  date1904?: boolean;
}

export interface CellSharedFormulaValue {
  sharedFormula: string;
  readonly formula?: string;
  result?: number | string | boolean | Date | CellErrorValue;
  date1904?: boolean;
}

export type CellValue =
  | null
  | number
  | string
  | boolean
  | Date
  | undefined
  | CellErrorValue
  | CellRichTextValue
  | CellHyperlinkValue
  | CellFormulaValue
  | CellSharedFormulaValue;

export interface CommentMargins {
  insetmode: 'auto' | 'custom';
  inset: number[];
}

export interface CommentProtection {
  locked: 'True' | 'False';
  lockText: 'True' | 'False';
}

export type CommentEditAs = 'twoCells' | 'oneCells' | 'absolute';

export interface Comment {
  texts?: RichText[];
  margins?: Partial<CommentMargins>;
  protection?: Partial<CommentProtection>;
  editAs?: CommentEditAs;
}

export interface Address {
  sheetName?: string;
  address: string;
  col: number;
  row: number;
  $col$row: string;
}

export interface CellModel {
  address: Address;
  style: Style;
  type: number;
  text?: string;
  hyperlink?: string;
  value?: CellValue;
  master: string;
  formula?: string;
  sharedFormula?: string;
  result?: CellValue;
  comment: Comment;
}

// Cell requirements
//  Operate inside a worksheet
//  Store and retrieve a value with a range of types: text, number, date, hyperlink, reference, formula, etc.
//  Manage/use and manipulate cell format either as local to cell or inherited from column or row.

export interface CellValueModel {
  address: string;
  type: number;
  [key: string]: unknown;
}

// The Value hierarchy is a runtime-dispatched duck-typed union (see the
// `Value` dispatcher below) — different variants expose different optional
// members. This interface is intentionally the superset of everything any
// variant, or any caller reaching into `_value`, ever accesses.
export interface CellValueImpl {
  model: CellValueModel;
  value: unknown;
  readonly type: Enums.ValueType;
  readonly effectiveType: Enums.ValueType;
  address: string;
  toCsvString(): string | number;
  release(): void;
  toString(): string;
  master?: Cell;
  isMergedTo?(master: unknown): boolean;
  formula?: string;
  result?: unknown;
  formulaType?: number;
  dependencies?: { ranges: string[] | null; cells: string[] | null };
  text?: string;
  hyperlink?: string;
  tooltip?: string;
  cell?: Cell;
}

function isObjectRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !(val instanceof Date);
}

function isNoteModel(c: unknown): c is NoteModel {
  return typeof c === 'object' && c !== null && (c as { type?: string }).type === 'note';
}

export class Cell {
  static Types = Enums.ValueType;
  _row: RowLike;
  _column: ColumnLike;
  _address: string;
  _value: CellValueImpl;
  style: Partial<Style>;
  _mergeCount: number;
  _comment: Note | undefined;

  constructor(row?: RowLike, column?: ColumnLike, address?: string) {
    if (!row || !column || !address) {
      throw new Error('A Cell needs a Row');
    }

    this._row = row;
    this._column = column;

    colCache.validateAddress(address);
    this._address = address;

    // TODO: lazy evaluation of this._value
    this._value = Value.create(Enums.ValueType.Null, this);

    this.style = this._mergeStyle(row.style ?? {}, column.style ?? {}, {});

    this._mergeCount = 0;
  }

  get worksheet(): WorksheetLike | undefined {
    return this._row.worksheet;
  }

  get workbook(): WorkbookLike | undefined {
    return this.worksheet?.workbook;
  }

  get sheetName(): string {
    return this.worksheet?.name ?? '';
  }

  // help GC by removing cyclic (and other) references
  destroy() {
    this.style = {};
    this._value = new NullValue(this);
  }

  release() {
    this.destroy();
  }

  // =========================================================================
  // Styles stuff
  get numFmt() {
    return this.style.numFmt ?? '';
  }

  set numFmt(value: string | undefined) {
    this.style.numFmt = value;
  }

  get font() {
    return this.style.font;
  }

  set font(value: Partial<Font> | undefined) {
    this.style.font = value;
  }

  get alignment() {
    return this.style.alignment;
  }

  set alignment(value: Partial<Alignment> | undefined) {
    this.style.alignment = value;
  }

  get border() {
    return this.style.border;
  }

  set border(value: Partial<Borders> | undefined) {
    this.style.border = value;
  }

  get fill() {
    return this.style.fill ?? { type: 'pattern', pattern: 'none' };
  }

  set fill(value: Fill | undefined) {
    this.style.fill = value;
  }

  get protection() {
    return this.style.protection;
  }

  set protection(value: Partial<Protection> | undefined) {
    this.style.protection = value;
  }

  _mergeStyle(
    rowStyle: Record<string, unknown>,
    colStyle: Record<string, unknown>,
    style: Record<string, unknown>,
  ) {
    const numFmt = rowStyle.numFmt ?? colStyle.numFmt;
    if (numFmt) style.numFmt = numFmt;

    const font = rowStyle.font ?? colStyle.font;
    if (font) style.font = font;

    const alignment = rowStyle.alignment ?? colStyle.alignment;
    if (alignment) style.alignment = alignment;

    const border = rowStyle.border ?? colStyle.border;
    if (border) style.border = border;

    const fill = rowStyle.fill ?? colStyle.fill;
    if (fill) style.fill = fill;

    const protection = rowStyle.protection ?? colStyle.protection;
    if (protection) style.protection = protection;

    return style;
  }

  // =========================================================================
  // return the address for this cell
  get address() {
    return this._address;
  }

  get row() {
    return this._row.number;
  }

  get col() {
    return this._column.number;
  }

  get $col$row() {
    return `$${this._column.letter}$${this.row}`;
  }

  // =========================================================================
  // Value stuff

  get type(): Enums.ValueType {
    return this._value.type;
  }

  get effectiveType(): Enums.ValueType {
    return this._value.effectiveType;
  }

  toCsvString(): string | number {
    return this._value.toCsvString();
  }

  // =========================================================================
  // Merge stuff

  addMergeRef() {
    this._mergeCount++;
  }

  releaseMergeRef() {
    this._mergeCount--;
  }

  get isMerged() {
    return this._mergeCount > 0 || this.type === Enums.ValueType.Merge;
  }

  merge(master: Cell, ignoreStyle?: boolean) {
    this._value.release();
    this._value = Value.create(Enums.ValueType.Merge, this, master);
    if (!ignoreStyle) {
      this.style = master.style;
    }
  }

  unmerge() {
    if (this.type === Enums.ValueType.Merge) {
      this._value.release();
      this._value = Value.create(Enums.ValueType.Null, this);
      this.style = this._mergeStyle(this._row.style ?? {}, this._column.style ?? {}, {});
    }
  }

  isMergedTo(master: unknown): boolean {
    if (this._value.type !== Enums.ValueType.Merge) return false;
    return this._value.isMergedTo!(master);
  }

  get master(): Cell {
    if (this.type === Enums.ValueType.Merge) {
      return this._value.master ?? this;
    }
    return this; // an unmerged cell is its own master
  }

  get isHyperlink() {
    return this._value.type === Enums.ValueType.Hyperlink;
  }

  get hyperlink() {
    return this._value.hyperlink;
  }

  // return the value
  get value(): CellValue {
    return this._value.value as CellValue;
  }

  // set the value - can be number, string or raw
  set value(v: CellValue) {
    // special case - merge cells set their master's value
    if (this.type === Enums.ValueType.Merge) {
      this._value.value = v;
      return;
    }

    this._value.release();

    // assign value
    this._value = Value.create(Value.getType(v), this, v);
  }

  get note() {
    return this._comment ? this._comment.note : undefined;
  }

  set note(note: string | Comment | undefined) {
    this._comment = note ? new Note(note) : undefined;
  }

  get text() {
    return this._value.toString();
  }

  get html() {
    return _.escapeHtml(this.text);
  }

  toString(): string {
    return this.text;
  }

  _upgradeToHyperlink(hyperlink: unknown) {
    // if this cell is a string, turn it into a Hyperlink
    if (this.type === Enums.ValueType.String) {
      this._value = Value.create(Enums.ValueType.Hyperlink, this, {
        text: this._value.value,
        hyperlink,
      });
    }
  }

  // =========================================================================
  // Formula stuff
  get formula() {
    return this._value.formula;
  }

  get result() {
    return this._value.result;
  }

  get formulaType() {
    return this._value.formulaType;
  }

  // =========================================================================
  // Name stuff
  get fullAddress() {
    const { worksheet } = this._row;
    return {
      sheetName: worksheet.name,
      address: this.address,
      row: this.row,
      col: this.col,
    };
  }

  get name() {
    return this.names[0];
  }

  set name(value: string) {
    this.names = [value];
  }

  get names(): string[] {
    return this.workbook?.definedNames?.getNamesEx(this.fullAddress) ?? [];
  }

  set names(value: string[]) {
    const definedNames = this.workbook?.definedNames;
    if (definedNames) {
      definedNames.removeAllNames(this.fullAddress);
      value.forEach((name: string) => {
        definedNames.addEx(this.fullAddress, name);
      });
    }
  }

  addName(name: string) {
    this.workbook?.definedNames?.addEx(this.fullAddress, name);
  }

  removeName(name: string) {
    this.workbook?.definedNames?.removeEx(this.fullAddress, name);
  }

  removeAllNames() {
    this.workbook?.definedNames?.removeAllNames(this.fullAddress);
  }

  // =========================================================================
  // Data Validation stuff
  get _dataValidations(): DataValidationLike | undefined {
    return this.worksheet?.dataValidations;
  }

  get dataValidation(): DataValidation | undefined {
    return this._dataValidations?.find(this.address);
  }

  set dataValidation(value: DataValidation | undefined) {
    if (value) {
      this._dataValidations?.add(this.address, value);
    } else {
      this._dataValidations?.remove?.(this.address);
    }
  }

  // =========================================================================
  // Model stuff

  get model() {
    const { model } = this._value;
    model.style = this.style;
    if (this._comment) {
      model.comment = this._comment.model;
    }
    return model;
  }

  set model(value: CellModel | CellValueModel) {
    this._value.release();
    this._value = Value.create(value.type, this);
    this._value.model = value as CellValueModel;

    if (value.comment) {
      if (isNoteModel(value.comment)) {
        this._comment = Note.fromModel(value.comment);
      }
    }

    if (value.style) {
      this.style = value.style;
    } else {
      this.style = {};
    }
  }
}

// =============================================================================
// Internal Value Types

class NullValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Null,
    };
  }

  get value() {
    return null;
  }

  set value(_value: unknown) {
    // nothing to do
  }

  get type() {
    return Enums.ValueType.Null;
  }

  get effectiveType() {
    return Enums.ValueType.Null;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return '';
  }

  release() {}

  toString(): string {
    return '';
  }
}

class NumberValue implements CellValueImpl {
  model: CellValueModel & { value: number };

  constructor(cell: Cell, value: number) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Number,
      value,
    };
  }

  get value(): number {
    return this.model.value;
  }

  set value(value: number) {
    this.model.value = value;
  }

  get type() {
    return Enums.ValueType.Number;
  }

  get effectiveType() {
    return Enums.ValueType.Number;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return String(this.model.value);
  }

  release() {}

  toString(): string {
    return String(this.model.value);
  }
}

class StringValue implements CellValueImpl {
  model: CellValueModel & { value: string };

  constructor(cell: Cell, value: string) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.String,
      value,
    };
  }

  get value(): string {
    return this.model.value;
  }

  set value(value: string) {
    this.model.value = value;
  }

  get type() {
    return Enums.ValueType.String;
  }

  get effectiveType() {
    return Enums.ValueType.String;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return `"${this.model.value.replace(/"/g, '""')}"`;
  }

  release() {}

  toString(): string {
    return this.model.value;
  }
}

interface RichTextRun {
  text: string;
  font?: Record<string, unknown>;
}

interface RichTextValueShape {
  richText: RichTextRun[];
}

class RichTextValue implements CellValueImpl {
  model: CellValueModel & { value: RichTextValueShape };

  constructor(cell: Cell, value: RichTextValueShape) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.String,
      value,
    };
  }

  get value(): RichTextValueShape {
    return this.model.value;
  }

  set value(value: RichTextValueShape) {
    this.model.value = value;
  }

  get text() {
    return this.model.value.richText.map((t) => t.text).join('');
  }

  toString(): string {
    return this.model.value.richText.map((t) => t.text).join('');
  }

  get type() {
    return Enums.ValueType.RichText;
  }

  get effectiveType() {
    return Enums.ValueType.RichText;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return `"${this.text.replace(/"/g, '""')}"`;
  }

  release() {}
}

class DateValue implements CellValueImpl {
  model: CellValueModel & { value: Date };
  constructor(cell: Cell, value: Date) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Date,
      value,
    };
  }

  get value(): Date {
    return this.model.value;
  }

  set value(value: Date) {
    this.model.value = value;
  }

  get type() {
    return Enums.ValueType.Date;
  }

  get effectiveType() {
    return Enums.ValueType.Date;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.model.value.toISOString();
  }

  release() {}

  toString(): string {
    return this.model.value.toString();
  }
}

interface HyperlinkValueShape {
  text?: string;
  hyperlink?: string;
  tooltip?: string;
}

class HyperlinkValue implements CellValueImpl {
  model: CellValueModel & { text?: string; hyperlink?: string; tooltip?: string };

  constructor(cell: Cell, value: HyperlinkValueShape | undefined) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Hyperlink,
      text: value ? value.text : undefined,
      hyperlink: value ? value.hyperlink : undefined,
    };
    if (value?.tooltip) {
      this.model.tooltip = value.tooltip;
    }
  }

  get value(): HyperlinkValueShape {
    const v: HyperlinkValueShape = {
      text: this.model.text,
      hyperlink: this.model.hyperlink,
    };
    if (this.model.tooltip) {
      v.tooltip = this.model.tooltip;
    }
    return v;
  }

  set value(value: HyperlinkValueShape) {
    this.model = {
      address: this.model.address,
      type: Enums.ValueType.Hyperlink,
      text: value.text,
      hyperlink: value.hyperlink,
    };
    if (value.tooltip) {
      this.model.tooltip = value.tooltip;
    }
  }

  get text(): string | undefined {
    return this.model.text;
  }

  set text(value: string | undefined) {
    this.model.text = value;
  }

  get hyperlink(): string | undefined {
    return this.model.hyperlink;
  }

  set hyperlink(value: string | undefined) {
    this.model.hyperlink = value;
  }

  get type() {
    return Enums.ValueType.Hyperlink;
  }

  get effectiveType() {
    return Enums.ValueType.Hyperlink;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.model.hyperlink ?? '';
  }

  release() {}

  toString(): string {
    return this.model.text ?? '';
  }
}

class MergeValue implements CellValueImpl {
  model: CellValueModel;
  _master: Cell | undefined;

  constructor(cell: Cell, master: Cell | undefined) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Merge,
      master: master ? master.address : undefined,
    };
    this._master = master;
    if (master) {
      master.addMergeRef();
    }
  }

  get value() {
    return this._master?.value;
  }

  set value(value: unknown) {
    if (value instanceof Cell) {
      if (this._master) {
        this._master.releaseMergeRef();
      }
      value.addMergeRef();
      this._master = value;
    } else if (this._master) {
      this._master.value = value as CellValue;
    }
  }

  isMergedTo(master: unknown): boolean {
    return master === this._master;
  }

  get master(): Cell | undefined {
    return this._master;
  }

  get type() {
    return Enums.ValueType.Merge;
  }

  get effectiveType() {
    return this._master ? this._master.effectiveType : Enums.ValueType.Null;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return '';
  }

  release() {
    this._master?.releaseMergeRef();
  }

  toString(): string {
    const val = this.value;
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object' && 'toString' in val && typeof val.toString === 'function') {
      return (val as { toString(): string }).toString();
    }
    return '';
  }
}

interface FormulaValueShape {
  shareType?: string;
  ref?: string;
  formula?: string;
  sharedFormula?: string;
  result?: unknown;
}

class FormulaValue implements CellValueImpl {
  cell: Cell;
  model: CellValueModel & {
    formula?: string;
    sharedFormula?: string;
    shareType?: string;
    ref?: string;
    result?: unknown;
  };
  _translatedFormula: string | undefined;

  constructor(cell: Cell, value: FormulaValueShape | undefined) {
    this.cell = cell;

    this.model = {
      address: cell.address,
      type: Enums.ValueType.Formula,
      shareType: value ? value.shareType : undefined,
      ref: value ? value.ref : undefined,
      formula: value ? value.formula : undefined,
      sharedFormula: value ? value.sharedFormula : undefined,
      result: value ? value.result : undefined,
    };
  }

  _copyModel(model: Record<string, unknown>): Record<string, unknown> {
    const copy: Record<string, unknown> = {};
    const cp = (name: string) => {
      const value = model[name];
      if (value) {
        copy[name] = value;
      }
    };
    cp('formula');
    cp('result');
    cp('ref');
    cp('shareType');
    cp('sharedFormula');
    return copy;
  }

  get value() {
    return this._copyModel(this.model);
  }

  set value(value: Record<string, unknown>) {
    this.model = {
      address: this.model.address,
      type: Enums.ValueType.Formula,
      ...this._copyModel(value),
    };
  }

  validate(value: unknown) {
    switch (Value.getType(value)) {
      case Enums.ValueType.Null:
      case Enums.ValueType.String:
      case Enums.ValueType.Number:
      case Enums.ValueType.Date:
        break;
      case Enums.ValueType.Hyperlink:
      case Enums.ValueType.Formula:
      case Enums.ValueType.Merge:
      case Enums.ValueType.SharedString:
      case Enums.ValueType.RichText:
      case Enums.ValueType.Boolean:
      case Enums.ValueType.Error:
      case 11:
      default:
        throw new Error('Cannot process that type of result value');
    }
  }

  get dependencies() {
    // find all the ranges and cells mentioned in the formula
    const form = this.formula ?? '';
    const ranges = form.match(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}:[A-Z]{1,3}\d{1,4}/g);
    const cells = form
      .replace(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}:[A-Z]{1,3}\d{1,4}/g, '')
      .match(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}/g);
    return {
      ranges,
      cells,
    };
  }

  get formula(): string | undefined {
    return this.model.formula ?? this._getTranslatedFormula();
  }

  set formula(value: string | undefined) {
    this.model.formula = value;
  }

  get formulaType() {
    if (this.model.formula) {
      return Enums.FormulaType.Master;
    }
    if (this.model.sharedFormula) {
      return Enums.FormulaType.Shared;
    }
    return Enums.FormulaType.None;
  }

  get result() {
    return this.model.result;
  }

  set result(value: unknown) {
    this.model.result = value;
  }

  get type() {
    return Enums.ValueType.Formula;
  }

  get effectiveType() {
    const v = this.model.result;
    if (v === null || v === undefined) {
      return Enums.ValueType.Null;
    }
    if (
      typeof v === 'string' ||
      (typeof v === 'object' && Object.prototype.toString.call(v) === '[object String]')
    ) {
      return Enums.ValueType.String;
    }
    if (typeof v === 'number') {
      return Enums.ValueType.Number;
    }
    if (v instanceof Date) {
      return Enums.ValueType.Date;
    }
    if (isObjectRecord(v)) {
      if (v.text && v.hyperlink) {
        return Enums.ValueType.Hyperlink;
      }
      if (v.formula) {
        return Enums.ValueType.Formula;
      }
    }

    return Enums.ValueType.Null;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  _getTranslatedFormula(): string | undefined {
    if (!this._translatedFormula && this.model.sharedFormula) {
      const ws = this.cell.worksheet;
      const master = ws?.findCell ? ws.findCell(this.model.sharedFormula) : undefined;
      const formula = master?.formula;
      const address = master?.address ?? '';
      this._translatedFormula = formula
        ? slideFormula(formula, address, this.model.address)
        : undefined;
    }
    return this._translatedFormula;
  }

  toCsvString(): string {
    const res = this.model.result;
    if (res === null || res === undefined) return '';
    if (typeof res === 'string') return res;
    if (typeof res === 'number' || typeof res === 'boolean') return String(res);
    if (res instanceof Date) return res.toISOString();
    return '';
  }

  release() {}

  toString(): string {
    const res = this.model.result;
    if (res === null || res === undefined) return '';
    if (typeof res === 'string') return res;
    if (typeof res === 'number' || typeof res === 'boolean') return String(res);
    if (res instanceof Date) return res.toString();
    return '';
  }
}

class SharedStringValue implements CellValueImpl {
  model: CellValueModel & { value: unknown };

  constructor(cell: Cell, value: unknown) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.String,
      value,
    };
  }

  get value(): unknown {
    return this.model.value;
  }

  set value(value: unknown) {
    this.model.value = value;
  }

  get type() {
    return Enums.ValueType.String;
  }

  get effectiveType() {
    return Enums.ValueType.String;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.toString();
  }

  release() {}

  toString(): string {
    return String(this.model.value ?? '');
  }
}

class BooleanValue implements CellValueImpl {
  model: CellValueModel & { value: boolean };

  constructor(cell: Cell, value: boolean) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Boolean,
      value,
    };
  }

  get value(): boolean {
    return this.model.value;
  }

  set value(value: boolean) {
    this.model.value = value;
  }

  get type() {
    return Enums.ValueType.Boolean;
  }

  get effectiveType() {
    return Enums.ValueType.Boolean;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): number {
    return this.model.value ? 1 : 0;
  }

  release() {}

  toString(): string {
    return String(this.model.value);
  }
}

interface ErrorValueShape {
  error: string;
}

class ErrorValue implements CellValueImpl {
  model: CellValueModel & { value: ErrorValueShape };

  constructor(cell: Cell, value: ErrorValueShape) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.Error,
      value,
    };
  }

  get value(): ErrorValueShape {
    return this.model.value;
  }

  set value(value: ErrorValueShape) {
    this.model.value = value;
  }

  get type() {
    return Enums.ValueType.Error;
  }

  get effectiveType() {
    return Enums.ValueType.Error;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.toString();
  }

  release() {}

  toString(): string {
    return this.model.value.error;
  }
}

class JSONValue implements CellValueImpl {
  model: CellValueModel & { value: string; rawValue: unknown };

  constructor(cell: Cell, value: unknown) {
    this.model = {
      address: cell.address,
      type: Enums.ValueType.String,
      value: JSON.stringify(value),
      rawValue: value,
    };
  }

  get value() {
    return this.model.rawValue;
  }

  set value(value: unknown) {
    this.model.rawValue = value;
    this.model.value = JSON.stringify(value);
  }

  get type() {
    return Enums.ValueType.String;
  }

  get effectiveType() {
    return Enums.ValueType.String;
  }

  get address() {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.model.value;
  }

  release() {}

  toString(): string {
    return this.model.value;
  }
}

// Value is a place to hold common static Value type functions
const Value = {
  getType(value: unknown): Enums.ValueType | 11 {
    if (value === null || value === undefined) {
      return Enums.ValueType.Null;
    }
    if (
      typeof value === 'string' ||
      (typeof value === 'object' && Object.prototype.toString.call(value) === '[object String]')
    ) {
      return Enums.ValueType.String;
    }
    if (typeof value === 'number') {
      return Enums.ValueType.Number;
    }
    if (typeof value === 'boolean') {
      return Enums.ValueType.Boolean;
    }
    if (value instanceof Date) {
      return Enums.ValueType.Date;
    }
    if (isObjectRecord(value)) {
      if (value.text && value.hyperlink) {
        return Enums.ValueType.Hyperlink;
      }
      if (value.formula || value.sharedFormula) {
        return Enums.ValueType.Formula;
      }
      if (value.richText) {
        return Enums.ValueType.RichText;
      }
      if (value.sharedString !== undefined) {
        return Enums.ValueType.SharedString;
      }
      if (value.error) {
        return Enums.ValueType.Error;
      }
    }
    return 11;
  },

  create(type: number, cell: Cell, value?: unknown): CellValueImpl {
    switch (type) {
      case Enums.ValueType.Null:
        return new NullValue(cell);
      case Enums.ValueType.Number:
        return new NumberValue(cell, value as number);
      case Enums.ValueType.String:
        return new StringValue(cell, value as string);
      case Enums.ValueType.Date:
        return new DateValue(cell, value as Date);
      case Enums.ValueType.Hyperlink:
        return new HyperlinkValue(cell, value as HyperlinkValueShape);
      case Enums.ValueType.Formula:
        return new FormulaValue(cell, value as FormulaValueShape);
      case Enums.ValueType.Merge:
        return new MergeValue(cell, value as Cell);
      case 11:
        return new JSONValue(cell, value);
      case Enums.ValueType.SharedString:
        return new SharedStringValue(cell, value as number);
      case Enums.ValueType.RichText:
        return new RichTextValue(cell, value as RichTextValueShape);
      case Enums.ValueType.Boolean:
        return new BooleanValue(cell, value as boolean);
      case Enums.ValueType.Error:
        return new ErrorValue(cell, value as ErrorValueShape);
      default:
        throw new Error(`Could not create Value of type ${type}`);
    }
  },
};

export default Cell;
