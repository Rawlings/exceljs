/* eslint-disable max-classes-per-file */
import colCache from '../utils/data/col-cache';
import _ from '../utils/helpers/under-dash';
import Enums from './enums';
import { slideFormula } from '../utils/data/shared-formula';
import Note from './note';
import type { NoteModel } from './note';
import type { RowLike, ColumnLike, FullAddress } from './internal-types';
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
  readonly type: number;
  readonly effectiveType: number;
  address: string;
  toCsvString(): string | number;
  release(): void;
  toString(): string;
  master?: CellValueImpl | Cell;
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

export class Cell {
  static Types: Record<string, number> = {};
  _row: RowLike;
  _column: ColumnLike;
  _address: string;
  _value: CellValueImpl;
  style: Partial<Style>;
  _mergeCount: number;
  _comment: Note | undefined;

  constructor(row?: RowLike, column?: ColumnLike, address?: string) {
    if (!row || !column) {
      throw new Error('A Cell needs a Row');
    }

    this._row = row;
    this._column = column;

    colCache.validateAddress(address as string);
    this._address = address as string;

    // TODO: lazy evaluation of this._value
    this._value = Value.create(Cell.Types.Null, this);

    this.style = this._mergeStyle(row.style, column.style, {});

    this._mergeCount = 0;
  }

  get worksheet() {
    return (this._row as unknown as { worksheet: unknown }).worksheet;
  }

  get workbook() {
    return (this._row as unknown as { worksheet: { workbook: unknown } }).worksheet.workbook;
  }

  get sheetName(): string {
    return (this._row as unknown as { worksheet: { name: string } })?.worksheet?.name || '';
  }

  // help GC by removing cyclic (and other) references
  destroy() {
    const self = this as unknown as Record<string, unknown>;
    delete self.style;
    delete self._value;
    delete self._row;
    delete self._column;
    delete self._address;
  }

  release() {
    this.destroy();
  }

  // =========================================================================
  // Styles stuff
  get numFmt(): string {
    return (this.style.numFmt as string) || '';
  }

  set numFmt(value: string) {
    this.style.numFmt = value;
  }

  get font(): Partial<Font> {
    return this.style.font || {};
  }

  set font(value: Partial<Font>) {
    this.style.font = value;
  }

  get alignment(): Partial<Alignment> {
    return this.style.alignment || {};
  }

  set alignment(value: Partial<Alignment>) {
    this.style.alignment = value;
  }

  get border(): Partial<Borders> {
    return this.style.border || {};
  }

  set border(value: Partial<Borders>) {
    this.style.border = value;
  }

  get fill(): Fill {
    return this.style.fill || { type: 'pattern', pattern: 'none' };
  }

  set fill(value: Fill) {
    this.style.fill = value;
  }

  get protection(): Partial<Protection> {
    return this.style.protection || {};
  }

  set protection(value: Partial<Protection>) {
    this.style.protection = value;
  }

  _mergeStyle(
    rowStyle: Record<string, unknown>,
    colStyle: Record<string, unknown>,
    style: Record<string, unknown>
  ) {
    const numFmt = (rowStyle && rowStyle.numFmt) || (colStyle && colStyle.numFmt);
    if (numFmt) style.numFmt = numFmt;

    const font = (rowStyle && rowStyle.font) || (colStyle && colStyle.font);
    if (font) style.font = font;

    const alignment = (rowStyle && rowStyle.alignment) || (colStyle && colStyle.alignment);
    if (alignment) style.alignment = alignment;

    const border = (rowStyle && rowStyle.border) || (colStyle && colStyle.border);
    if (border) style.border = border;

    const fill = (rowStyle && rowStyle.fill) || (colStyle && colStyle.fill);
    if (fill) style.fill = fill;

    const protection = (rowStyle && rowStyle.protection) || (colStyle && colStyle.protection);
    if (protection) style.protection = protection;

    return style;
  }

  // =========================================================================
  // return the address for this cell
  get address(): string {
    return this._address;
  }

  get row(): number {
    return this._row.number;
  }

  get col(): number {
    return this._column.number;
  }

  get $col$row(): string {
    return `$${(this._column as unknown as { letter: string }).letter}$${this.row}`;
  }

  // =========================================================================
  // Value stuff

  get type(): number {
    return this._value.type;
  }

  get effectiveType(): number {
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

  get isMerged(): boolean {
    return this._mergeCount > 0 || this.type === Cell.Types.Merge;
  }

  merge(master: Cell, ignoreStyle?: boolean) {
    this._value.release();
    this._value = Value.create(Cell.Types.Merge, this, master);
    if (!ignoreStyle) {
      this.style = master.style;
    }
  }

  unmerge() {
    if (this.type === Cell.Types.Merge) {
      this._value.release();
      this._value = Value.create(Cell.Types.Null, this);
      this.style = this._mergeStyle(this._row.style, this._column.style, {});
    }
  }

  isMergedTo(master: unknown): boolean {
    if (this._value.type !== Cell.Types.Merge) return false;
    return this._value.isMergedTo!(master);
  }

  get master(): CellValueImpl | Cell {
    if (this.type === Cell.Types.Merge) {
      return this._value.master!;
    }
    return this; // an unmerged cell is its own master
  }

  get isHyperlink(): boolean {
    return this._value.type === Cell.Types.Hyperlink;
  }

  get hyperlink(): string | undefined {
    return this._value.hyperlink;
  }

  // return the value
  get value(): unknown {
    return this._value.value;
  }

  // set the value - can be number, string or raw
  set value(v: unknown) {
    // special case - merge cells set their master's value
    if (this.type === Cell.Types.Merge) {
      (this._value.master as CellValueImpl | Cell).value = v;
      return;
    }

    this._value.release();

    // assign value
    this._value = Value.create(Value.getType(v), this, v);
  }

  get note(): string | Comment | undefined {
    return this._comment ? (this._comment.note as string | Comment) : undefined;
  }

  set note(note: string | Comment | undefined) {
    this._comment = note ? new Note(note) : undefined;
  }

  get text(): string {
    return this._value.toString();
  }

  get html(): string {
    return _.escapeHtml(this.text);
  }

  toString(): string {
    return this.text;
  }

  _upgradeToHyperlink(hyperlink: unknown) {
    // if this cell is a string, turn it into a Hyperlink
    if (this.type === Cell.Types.String) {
      this._value = Value.create(Cell.Types.Hyperlink, this, {
        text: this._value.value,
        hyperlink,
      });
    }
  }

  // =========================================================================
  // Formula stuff
  get formula(): string | undefined {
    return this._value.formula;
  }

  get result(): unknown {
    return this._value.result;
  }

  get formulaType(): number | undefined {
    return this._value.formulaType;
  }

  // =========================================================================
  // Name stuff
  get fullAddress(): FullAddress {
    const { worksheet } = this._row as unknown as { worksheet: { name: string } };
    return {
      sheetName: worksheet.name,
      address: this.address,
      row: this.row,
      col: this.col,
    };
  }

  get name(): string {
    return this.names[0];
  }

  set name(value: string) {
    this.names = [value];
  }

  get names(): string[] {
    return (
      this.workbook as {
        definedNames: { getNamesEx(address: FullAddress): string[] };
      }
    ).definedNames.getNamesEx(this.fullAddress);
  }

  set names(value: string[]) {
    const { definedNames } = this.workbook as {
      definedNames: {
        removeAllNames(address: FullAddress): void;
        addEx(address: FullAddress, name: string): void;
      };
    };
    definedNames.removeAllNames(this.fullAddress);
    value.forEach((name: string) => {
      definedNames.addEx(this.fullAddress, name);
    });
  }

  addName(name: string) {
    (
      this.workbook as { definedNames: { addEx(a: FullAddress, n: string): void } }
    ).definedNames.addEx(this.fullAddress, name);
  }

  removeName(name: string) {
    (
      this.workbook as { definedNames: { removeEx(a: FullAddress, n: string): void } }
    ).definedNames.removeEx(this.fullAddress, name);
  }

  removeAllNames() {
    (
      this.workbook as { definedNames: { removeAllNames(a: FullAddress): void } }
    ).definedNames.removeAllNames(this.fullAddress);
  }

  // =========================================================================
  // Data Validation stuff
  get _dataValidations() {
    return (this.worksheet as { dataValidations: unknown }).dataValidations as {
      find(address: string): unknown;
      add(address: string, validation: unknown): unknown;
    };
  }

  get dataValidation(): DataValidation | undefined {
    return this._dataValidations.find(this.address) as DataValidation | undefined;
  }

  set dataValidation(value: DataValidation | undefined) {
    this._dataValidations.add(this.address, value);
  }

  // =========================================================================
  // Model stuff

  get model(): CellModel | CellValueModel {
    const { model } = this._value;
    model.style = this.style;
    if (this._comment) {
      model.comment = (this._comment as unknown as { model: unknown }).model;
    }
    return model as unknown as CellModel;
  }

  set model(value: CellModel | CellValueModel) {
    this._value.release();
    this._value = Value.create(value.type, this);
    this._value.model = value as CellValueModel;

    if (value.comment) {
      const comment = value.comment as { type: string };
      switch (comment.type) {
        case 'note':
          this._comment = Note.fromModel(comment as unknown as NoteModel);
          break;
      }
    }

    if (value.style) {
      this.style = value.style as Record<string, unknown>;
    } else {
      this.style = {};
    }
  }
}
Cell.Types = Enums.ValueType as unknown as Record<string, number>;

// =============================================================================
// Internal Value Types

class NullValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Null,
    };
  }

  get value(): null {
    return null;
  }

  set value(_value: unknown) {
    // nothing to do
  }

  get type(): number {
    return Cell.Types.Null;
  }

  get effectiveType(): number {
    return Cell.Types.Null;
  }

  get address(): string {
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
  model: CellValueModel;

  constructor(cell: Cell, value: number) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Number,
      value,
    };
  }

  get value(): number {
    return this.model.value as number;
  }

  set value(value: number) {
    this.model.value = value;
  }

  get type(): number {
    return Cell.Types.Number;
  }

  get effectiveType(): number {
    return Cell.Types.Number;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return (this.model.value as number).toString();
  }

  release() {}

  toString(): string {
    return (this.model.value as number).toString();
  }
}

class StringValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell, value: string) {
    this.model = {
      address: cell.address,
      type: Cell.Types.String,
      value,
    };
  }

  get value(): string {
    return this.model.value as string;
  }

  set value(value: string) {
    this.model.value = value;
  }

  get type(): number {
    return Cell.Types.String;
  }

  get effectiveType(): number {
    return Cell.Types.String;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return `"${(this.model.value as string).replace(/"/g, '""')}"`;
  }

  release() {}

  toString(): string {
    return this.model.value as string;
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
  model: CellValueModel;

  constructor(cell: Cell, value: RichTextValueShape) {
    this.model = {
      address: cell.address,
      type: Cell.Types.String,
      value,
    };
  }

  get value(): RichTextValueShape {
    return this.model.value as RichTextValueShape;
  }

  set value(value: RichTextValueShape) {
    this.model.value = value;
  }

  get text(): string {
    return (this.model.value as RichTextValueShape).richText.map((t) => t.text).join('');
  }

  toString(): string {
    return (this.model.value as RichTextValueShape).richText.map((t) => t.text).join('');
  }

  get type(): number {
    return Cell.Types.RichText;
  }

  get effectiveType(): number {
    return Cell.Types.RichText;
  }

  get address(): string {
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
  model: CellValueModel;
  constructor(cell: Cell, value: Date) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Date,
      value,
    };
  }

  get value(): Date {
    return this.model.value as Date;
  }

  set value(value: Date) {
    this.model.value = value;
  }

  get type(): number {
    return Cell.Types.Date;
  }

  get effectiveType(): number {
    return Cell.Types.Date;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return (this.model.value as Date).toISOString();
  }

  release() {}

  toString(): string {
    return (this.model.value as Date).toString();
  }
}

interface HyperlinkValueShape {
  text?: string;
  hyperlink?: string;
  tooltip?: string;
}

class HyperlinkValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell, value: HyperlinkValueShape | undefined) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Hyperlink,
      text: value ? value.text : undefined,
      hyperlink: value ? value.hyperlink : undefined,
    };
    if (value && value.tooltip) {
      this.model.tooltip = value.tooltip;
    }
  }

  get value(): HyperlinkValueShape {
    const v: HyperlinkValueShape = {
      text: this.model.text as string,
      hyperlink: this.model.hyperlink as string,
    };
    if (this.model.tooltip) {
      v.tooltip = this.model.tooltip as string;
    }
    return v;
  }

  set value(value: HyperlinkValueShape) {
    this.model = {
      address: this.model.address,
      type: Cell.Types.Hyperlink,
      text: value.text,
      hyperlink: value.hyperlink,
    };
    if (value.tooltip) {
      this.model.tooltip = value.tooltip;
    }
  }

  get text(): string | undefined {
    return this.model.text as string | undefined;
  }

  set text(value: string | undefined) {
    this.model.text = value;
  }

  /*
  get tooltip() {
    return this.model.tooltip;
  }

  set tooltip(value: any) {
    this.model.tooltip = value;
  } */

  get hyperlink(): string | undefined {
    return this.model.hyperlink as string | undefined;
  }

  set hyperlink(value: string | undefined) {
    this.model.hyperlink = value;
  }

  get type(): number {
    return Cell.Types.Hyperlink;
  }

  get effectiveType(): number {
    return Cell.Types.Hyperlink;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.model.hyperlink as string;
  }

  release() {}

  toString(): string {
    return this.model.text as string;
  }
}

class MergeValue implements CellValueImpl {
  model: CellValueModel;
  _master: Cell | undefined;

  constructor(cell: Cell, master: Cell | undefined) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Merge,
      master: master ? master.address : undefined,
    };
    this._master = master;
    if (master) {
      master.addMergeRef();
    }
  }

  get value(): unknown {
    return (this._master as Cell).value;
  }

  set value(value: unknown) {
    if (value instanceof Cell) {
      if (this._master) {
        this._master.releaseMergeRef();
      }
      value.addMergeRef();
      this._master = value;
    } else {
      (this._master as Cell).value = value;
    }
  }

  isMergedTo(master: unknown): boolean {
    return master === this._master;
  }

  get master(): Cell | undefined {
    return this._master;
  }

  get type(): number {
    return Cell.Types.Merge;
  }

  get effectiveType(): number {
    return (this._master as Cell).effectiveType;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return '';
  }

  release() {
    (this._master as Cell).releaseMergeRef();
  }

  toString(): string {
    return (this.value as { toString(): string }).toString();
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
  model: CellValueModel;
  _translatedFormula: string | undefined;

  constructor(cell: Cell, value: FormulaValueShape | undefined) {
    this.cell = cell;

    this.model = {
      address: cell.address,
      type: Cell.Types.Formula,
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

  get value(): Record<string, unknown> {
    return this._copyModel(this.model);
  }

  set value(value: Record<string, unknown>) {
    this.model = this._copyModel(value) as CellValueModel;
  }

  validate(value: unknown) {
    switch (Value.getType(value)) {
      case Cell.Types.Null:
      case Cell.Types.String:
      case Cell.Types.Number:
      case Cell.Types.Date:
        break;
      case Cell.Types.Hyperlink:
      case Cell.Types.Formula:
      default:
        throw new Error('Cannot process that type of result value');
    }
  }

  get dependencies(): { ranges: string[] | null; cells: string[] | null } {
    // find all the ranges and cells mentioned in the formula
    const ranges = (this.formula as string).match(
      /([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}:[A-Z]{1,3}\d{1,4}/g
    );
    const cells = (this.formula as string)
      .replace(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}:[A-Z]{1,3}\d{1,4}/g, '')
      .match(/([a-zA-Z0-9]+!)?[A-Z]{1,3}\d{1,4}/g);
    return {
      ranges,
      cells,
    };
  }

  get formula(): string | undefined {
    return (this.model.formula as string) || this._getTranslatedFormula();
  }

  set formula(value: string | undefined) {
    this.model.formula = value;
  }

  get formulaType(): number {
    if (this.model.formula) {
      return Enums.FormulaType.Master;
    }
    if (this.model.sharedFormula) {
      return Enums.FormulaType.Shared;
    }
    return Enums.FormulaType.None;
  }

  get result(): unknown {
    return this.model.result;
  }

  set result(value: unknown) {
    this.model.result = value;
  }

  get type(): number {
    return Cell.Types.Formula;
  }

  get effectiveType(): number {
    const v = this.model.result;
    if (v === null || v === undefined) {
      return Enums.ValueType.Null;
    }
    if (v instanceof String || typeof v === 'string') {
      return Enums.ValueType.String;
    }
    if (typeof v === 'number') {
      return Enums.ValueType.Number;
    }
    if (v instanceof Date) {
      return Enums.ValueType.Date;
    }
    if ((v as Record<string, unknown>).text && (v as Record<string, unknown>).hyperlink) {
      return Enums.ValueType.Hyperlink;
    }
    if ((v as Record<string, unknown>).formula) {
      return Enums.ValueType.Formula;
    }

    return Enums.ValueType.Null;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  _getTranslatedFormula(): string | undefined {
    if (!this._translatedFormula && this.model.sharedFormula) {
      const { worksheet } = this.cell as unknown as {
        worksheet: { findCell(address: string): { formula: string; address: string } | undefined };
      };
      const master = worksheet.findCell(this.model.sharedFormula as string);
      this._translatedFormula =
        master && slideFormula(master.formula, master.address, this.model.address);
    }
    return this._translatedFormula;
  }

  toCsvString(): string {
    return `${this.model.result || ''}`;
  }

  release() {}

  toString(): string {
    return this.model.result ? this.model.result.toString() : '';
  }
}

class SharedStringValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell, value: string) {
    this.model = {
      address: cell.address,
      type: Cell.Types.SharedString,
      value,
    };
  }

  get value(): string {
    return this.model.value as string;
  }

  set value(value: string) {
    this.model.value = value;
  }

  get type(): number {
    return Cell.Types.SharedString;
  }

  get effectiveType(): number {
    return Cell.Types.SharedString;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return (this.model.value as string).toString();
  }

  release() {}

  toString(): string {
    return (this.model.value as string).toString();
  }
}

class BooleanValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell, value: boolean) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Boolean,
      value,
    };
  }

  get value(): boolean {
    return this.model.value as boolean;
  }

  set value(value: boolean) {
    this.model.value = value;
  }

  get type(): number {
    return Cell.Types.Boolean;
  }

  get effectiveType(): number {
    return Cell.Types.Boolean;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  // NB: returns number, not string, unlike every other variant's
  // toCsvString() — preserved verbatim; CellValueImpl's signature is
  // widened to string | number to match rather than "fixing" this quirk.
  toCsvString(): number {
    return this.model.value ? 1 : 0;
  }

  release() {}

  toString(): string {
    return (this.model.value as boolean).toString();
  }
}

interface ErrorValueShape {
  error: string;
}

class ErrorValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell, value: ErrorValueShape) {
    this.model = {
      address: cell.address,
      type: Cell.Types.Error,
      value,
    };
  }

  get value(): ErrorValueShape {
    return this.model.value as ErrorValueShape;
  }

  set value(value: ErrorValueShape) {
    this.model.value = value;
  }

  get type(): number {
    return Cell.Types.Error;
  }

  get effectiveType(): number {
    return Cell.Types.Error;
  }

  get address(): string {
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
    return (this.model.value as ErrorValueShape).error.toString();
  }
}

class JSONValue implements CellValueImpl {
  model: CellValueModel;

  constructor(cell: Cell, value: unknown) {
    this.model = {
      address: cell.address,
      type: Cell.Types.String,
      value: JSON.stringify(value),
      rawValue: value,
    };
  }

  get value(): unknown {
    return this.model.rawValue;
  }

  set value(value: unknown) {
    this.model.rawValue = value;
    this.model.value = JSON.stringify(value);
  }

  get type(): number {
    return Cell.Types.String;
  }

  get effectiveType(): number {
    return Cell.Types.String;
  }

  get address(): string {
    return this.model.address;
  }

  set address(value: string) {
    this.model.address = value;
  }

  toCsvString(): string {
    return this.model.value as string;
  }

  release() {}

  toString(): string {
    return this.model.value as string;
  }
}

type ValueCtor = new (cell: Cell, value?: unknown) => CellValueImpl;

// Value is a place to hold common static Value type functions
const Value = {
  getType(value: unknown): number {
    if (value === null || value === undefined) {
      return Cell.Types.Null;
    }
    if (value instanceof String || typeof value === 'string') {
      return Cell.Types.String;
    }
    if (typeof value === 'number') {
      return Cell.Types.Number;
    }
    if (typeof value === 'boolean') {
      return Cell.Types.Boolean;
    }
    if (value instanceof Date) {
      return Cell.Types.Date;
    }
    const v = value as Record<string, unknown>;
    if (v.text && v.hyperlink) {
      return Cell.Types.Hyperlink;
    }
    if (v.formula || v.sharedFormula) {
      return Cell.Types.Formula;
    }
    if (v.richText) {
      return Cell.Types.RichText;
    }
    if (v.sharedString) {
      return Cell.Types.SharedString;
    }
    if (v.error) {
      return Cell.Types.Error;
    }
    return Cell.Types.JSON;
  },

  // map valueType to constructor
  types: [
    { t: Cell.Types.Null, f: NullValue },
    { t: Cell.Types.Number, f: NumberValue },
    { t: Cell.Types.String, f: StringValue },
    { t: Cell.Types.Date, f: DateValue },
    { t: Cell.Types.Hyperlink, f: HyperlinkValue },
    { t: Cell.Types.Formula, f: FormulaValue },
    { t: Cell.Types.Merge, f: MergeValue },
    { t: Cell.Types.JSON, f: JSONValue },
    { t: Cell.Types.SharedString, f: SharedStringValue },
    { t: Cell.Types.RichText, f: RichTextValue },
    { t: Cell.Types.Boolean, f: BooleanValue },
    { t: Cell.Types.Error, f: ErrorValue },
  ].reduce((p: Record<string, ValueCtor>, t) => {
    p[t.t as unknown as string] = t.f as unknown as ValueCtor;
    return p;
  }, {}),

  create(type: number, cell: Cell, value?: unknown): CellValueImpl {
    const T = this.types[type as unknown as string];
    if (!T) {
      throw new Error(`Could not create Value of type ${type}`);
    }
    return new T(cell, value);
  },
};

export default Cell;
