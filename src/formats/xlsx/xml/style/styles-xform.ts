/* eslint-disable max-classes-per-file */
import Enums from '../../../../core/enums';
import XmlStream from '../../../../utils/stream/xml-stream';

import BaseXform from '../base-xform';
import StaticXform from '../static-xform';
import ListXform from '../list-xform';
import FontXform from './font-xform';
import FillXform from './fill-xform';
import type { FillModel } from './fill-xform';
import BorderXform from './border-xform';
import type { BorderModel } from './border-xform';
import NumFmtXform from './numfmt-xform';
import StyleXform from './style-xform';
import type { StyleXfModel } from './style-xform';
import DxfXform from './dxf-xform';
import type { AlignmentModel } from './alignment-xform';
import type { ProtectionModel } from './protection-xform';
import type { SaxNode } from '../base-xform';

// custom numfmt ids start here
const NUMFMT_BASE = 164;

export interface CellStyleModel {
  numFmt?: string;
  font?: Record<string, unknown>;
  border?: BorderModel;
  fill?: FillModel;
  alignment?: AlignmentModel;
  protection?: ProtectionModel;
}

export interface StylesModel {
  styles: (string | StyleXfModel)[];
  numFmts: (string | { id: number; formatCode: string })[];
  fonts: (string | Record<string, unknown>)[];
  borders: (string | BorderModel)[];
  fills: (string | FillModel)[];
  dxfs?: unknown[];
}

interface StylesIndex {
  style: Record<string, number>;
  numFmt: Record<string | number, string | number>;
  numFmtNextId: number;
  font: Record<string, number>;
  border: Record<string, number>;
  fill: Record<string, number>;
  model?: Record<number, Record<string, unknown>>;
}

// =============================================================================
// StylesXform is used to generate and parse the styles.xml file
// it manages the collections of fonts, number formats, alignments, etc
class StylesXform extends BaseXform {
  static Mock: typeof StylesXformMock;
  static STYLESHEET_ATTRIBUTES: Record<string, string>;
  static STATIC_XFORMS: Record<string, StaticXform>;

  _dateStyleId: number | undefined;
  index: StylesIndex | undefined;
  weakMap: WeakMap<object, number> | undefined;
  override map: Record<string, BaseXform>;

  constructor(initialise?: boolean) {
    super();

    this.map = {
      numFmts: new ListXform({ tag: 'numFmts', count: true, childXform: new NumFmtXform() }),
      fonts: new ListXform({
        tag: 'fonts',
        count: true,
        childXform: new FontXform(),
        $: { 'x14ac:knownFonts': 1 },
      }),
      fills: new ListXform({ tag: 'fills', count: true, childXform: new FillXform() }),
      borders: new ListXform({ tag: 'borders', count: true, childXform: new BorderXform() }),
      cellStyleXfs: new ListXform({
        tag: 'cellStyleXfs',
        count: true,
        childXform: new StyleXform(),
      }),
      cellXfs: new ListXform({
        tag: 'cellXfs',
        count: true,
        childXform: new StyleXform({ xfId: true }),
      }),
      dxfs: new ListXform({ tag: 'dxfs', always: true, count: true, childXform: new DxfXform() }),

      // for style manager
      numFmt: new NumFmtXform(),
      font: new FontXform(),
      fill: new FillXform(),
      border: new BorderXform(),
      style: new StyleXform({ xfId: true }),

      cellStyles: StylesXform.STATIC_XFORMS.cellStyles,
      tableStyles: StylesXform.STATIC_XFORMS.tableStyles,
      extLst: StylesXform.STATIC_XFORMS.extLst,
    };

    if (initialise) {
      // StylesXform also acts as style manager and is used to build up styles-model during worksheet processing
      this.init();
    }
  }

  initIndex() {
    this.index = {
      style: {},
      numFmt: {},
      numFmtNextId: 164, // start custom format ids here
      font: {},
      border: {},
      fill: {},
    };
  }

  init() {
    // Prepare for Style Manager role
    this.model = {
      styles: [],
      numFmts: [],
      fonts: [],
      borders: [],
      fills: [],
      dxfs: [],
    };

    this.initIndex();

    // default (zero) border
    this._addBorder({});

    // add default (all zero) style
    this._addStyle({ numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0 });

    // add default fills
    this._addFill({ type: 'pattern', pattern: 'none' });
    this._addFill({ type: 'pattern', pattern: 'gray125' });

    this.weakMap = new WeakMap();
  }

  override render(xmlStream: XmlStream, modelInput?: StylesModel) {
    const model: StylesModel = modelInput || this.model;
    //
    //   <fonts count="2" x14ac:knownFonts="1">
    xmlStream.openXml(XmlStream.StdDocAttributes);

    xmlStream.openNode('styleSheet', StylesXform.STYLESHEET_ATTRIBUTES);

    if (this.index) {
      // model has been built by style manager role (contains xml)
      if (model.numFmts && model.numFmts.length) {
        xmlStream.openNode('numFmts', { count: model.numFmts.length });
        (model.numFmts as string[]).forEach((numFmtXml) => {
          xmlStream.writeXml(numFmtXml);
        });
        xmlStream.closeNode();
      }

      if (!model.fonts.length) {
        // default (zero) font
        this._addFont({
          size: 11,
          color: { theme: 1 },
          name: 'Calibri',
          family: 2,
          scheme: 'minor',
        });
      }
      xmlStream.openNode('fonts', { count: model.fonts.length, 'x14ac:knownFonts': 1 });
      (model.fonts as string[]).forEach((fontXml) => {
        xmlStream.writeXml(fontXml);
      });
      xmlStream.closeNode();

      xmlStream.openNode('fills', { count: model.fills.length });
      (model.fills as string[]).forEach((fillXml) => {
        xmlStream.writeXml(fillXml);
      });
      xmlStream.closeNode();

      xmlStream.openNode('borders', { count: model.borders.length });
      (model.borders as string[]).forEach((borderXml) => {
        xmlStream.writeXml(borderXml);
      });
      xmlStream.closeNode();

      this.map.cellStyleXfs.render(xmlStream, [
        { numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0 },
      ]);

      xmlStream.openNode('cellXfs', { count: model.styles.length });
      (model.styles as string[]).forEach((styleXml) => {
        xmlStream.writeXml(styleXml);
      });
      xmlStream.closeNode();
    } else {
      // model is plain JSON and needs to be xformed
      this.map.numFmts.render(xmlStream, model.numFmts);
      this.map.fonts.render(xmlStream, model.fonts);
      this.map.fills.render(xmlStream, model.fills);
      this.map.borders.render(xmlStream, model.borders);
      this.map.cellStyleXfs.render(xmlStream, [
        { numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0 },
      ]);
      this.map.cellXfs.render(xmlStream, model.styles);
    }

    StylesXform.STATIC_XFORMS.cellStyles.render(xmlStream);

    this.map.dxfs.render(xmlStream, model.dxfs);

    StylesXform.STATIC_XFORMS.tableStyles.render(xmlStream);
    StylesXform.STATIC_XFORMS.extLst.render(xmlStream);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'styleSheet':
        this.initIndex();
        return true;
      default:
        this.parser = this.map[node.name];
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
      case 'styleSheet': {
        this.model = {} as StylesModel;
        const add = (propName: keyof StylesModel, xform: BaseXform) => {
          if (xform.model && xform.model.length) {
            this.model[propName] = xform.model;
          }
        };
        add('numFmts', this.map.numFmts);
        add('fonts', this.map.fonts);
        add('fills', this.map.fills);
        add('borders', this.map.borders);
        add('styles', this.map.cellXfs);
        add('dxfs', this.map.dxfs);

        // index numFmts
        this.index = {
          model: {} as Record<number, Record<string, unknown>>,
          numFmt: {} as Record<string | number, string | number>,
        } as StylesIndex;
        if (this.model.numFmts) {
          const numFmtIndex = this.index.numFmt;
          (this.model.numFmts as Record<string, any>[]).forEach((numFmt: Record<string, any>) => {
            numFmtIndex[numFmt.id] = numFmt.formatCode;
          });
        }

        return false;
      }
      default:
        // not quite sure how we get here!
        return true;
    }
  }

  // add a cell's style model to the collection
  // each style property is processed and cross-referenced, etc.
  // the styleId is returned. Note: cellType is used when numFmt not defined
  addStyleModel(model: CellStyleModel, cellType?: number): number {
    if (!model) {
      return 0;
    }

    // if we have no default font, add it here now
    if (!this.model.fonts.length) {
      // default (zero) font
      this._addFont({ size: 11, color: { theme: 1 }, name: 'Calibri', family: 2, scheme: 'minor' });
    }

    // if we have seen this style object before, assume it has the same styleId
    if (this.weakMap && this.weakMap.has(model)) {
      return this.weakMap.get(model) as number;
    }

    const style: StyleXfModel & { numFmtId?: number } = {};
    cellType = cellType || Enums.ValueType.Number;

    if (model.numFmt) {
      style.numFmtId = this._addNumFmtStr(model.numFmt);
    } else {
      switch (cellType) {
        case Enums.ValueType.Number:
          style.numFmtId = this._addNumFmtStr('General');
          break;
        case Enums.ValueType.Date:
          style.numFmtId = this._addNumFmtStr('mm-dd-yy');
          break;
        default:
          break;
      }
    }

    if (model.font) {
      style.fontId = this._addFont(model.font);
    }

    if (model.border) {
      style.borderId = this._addBorder(model.border);
    }

    if (model.fill) {
      style.fillId = this._addFill(model.fill);
    }

    if (model.alignment) {
      style.alignment = model.alignment;
    }

    if (model.protection) {
      style.protection = model.protection;
    }

    const styleId = this._addStyle(style);
    if (this.weakMap) {
      this.weakMap.set(model, styleId);
    }
    return styleId;
  }

  // given a styleId (i.e. s="n"), get the cell's style model
  // objects are shared where possible.
  getStyleModel(id: number): Record<string, unknown> | null {
    // if the style doesn't exist return null
    const style = this.model.styles[id];
    if (!style) return null;

    const index = this.index as StylesIndex;

    // have we built this model before?
    let model = (index.model as Record<number, Record<string, unknown>>)[id];
    if (model) return model;

    // build a new model
    model = (index.model as Record<number, Record<string, unknown>>)[id] = {};

    // -------------------------------------------------------
    // number format
    if (style.numFmtId) {
      const numFmt = index.numFmt[style.numFmtId] || NumFmtXform.getDefaultFmtCode(style.numFmtId);
      if (numFmt) {
        model.numFmt = numFmt;
      }
    }

    function addStyle(name: string, group: unknown[], styleId: number | undefined) {
      if (styleId || styleId === 0) {
        const part = group[styleId];
        if (part) {
          model[name] = part;
        }
      }
    }

    addStyle('font', this.model.fonts, style.fontId);
    addStyle('border', this.model.borders, style.borderId);
    addStyle('fill', this.model.fills, style.fillId);

    // -------------------------------------------------------
    // alignment
    if (style.alignment) {
      model.alignment = style.alignment;
    }

    // -------------------------------------------------------
    // protection
    if (style.protection) {
      model.protection = style.protection;
    }

    return model;
  }

  addDxfStyle(style: CellStyleModel & { numFmtId?: number }): number {
    if (style.numFmt) {
      // register numFmtId to use it during dxf-xform rendering
      style.numFmtId = this._addNumFmtStr(style.numFmt);
    }

    this.model.dxfs.push(style);
    return this.model.dxfs.length - 1;
  }

  getDxfStyle(id: number): unknown {
    return this.model.dxfs[id];
  }

  // =========================================================================
  // Private Interface
  _addStyle(style: StyleXfModel): number {
    const xml = this.map.style.toXml(style);
    const index = this.index as StylesIndex;
    let idx = index.style[xml];
    if (idx === undefined) {
      idx = index.style[xml] = this.model.styles.length;
      this.model.styles.push(xml);
    }
    return idx;
  }

  // =========================================================================
  // Number Formats
  _addNumFmtStr(formatCode: string): number {
    // check if default format
    let index = NumFmtXform.getDefaultFmtId(formatCode);
    if (index !== undefined) return index;

    const idx = this.index as StylesIndex;
    // check if already in
    index = idx.numFmt[formatCode] as number;
    if (index !== undefined) return index;

    index = idx.numFmt[formatCode] = NUMFMT_BASE + this.model.numFmts.length;
    const xml = this.map.numFmt.toXml({ id: index, formatCode });
    this.model.numFmts.push(xml);
    return index as number;
  }

  // =========================================================================
  // Fonts
  _addFont(font: Record<string, unknown>): number {
    const xml = this.map.font.toXml(font);
    const index = this.index as StylesIndex;
    let idx = index.font[xml];
    if (idx === undefined) {
      idx = index.font[xml] = this.model.fonts.length;
      this.model.fonts.push(xml);
    }
    return idx;
  }

  // =========================================================================
  // Borders
  _addBorder(border: BorderModel): number {
    const xml = this.map.border.toXml(border);
    const index = this.index as StylesIndex;
    let idx = index.border[xml];
    if (idx === undefined) {
      idx = index.border[xml] = this.model.borders.length;
      this.model.borders.push(xml);
    }
    return idx;
  }

  // =========================================================================
  // Fills
  _addFill(fill: FillModel): number {
    const xml = this.map.fill.toXml(fill);
    const index = this.index as StylesIndex;
    let idx = index.fill[xml];
    if (idx === undefined) {
      idx = index.fill[xml] = this.model.fills.length;
      this.model.fills.push(xml);
    }
    return idx;
  }

  // =========================================================================
}

StylesXform.STYLESHEET_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'x14ac x16r2',
  'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
  'xmlns:x16r2': 'http://schemas.microsoft.com/office/spreadsheetml/2015/02/main',
};
StylesXform.STATIC_XFORMS = {
  cellStyles: new StaticXform({
    tag: 'cellStyles',
    $: { count: 1 },
    c: [{ tag: 'cellStyle', $: { name: 'Normal', xfId: 0, builtinId: 0 } }],
  }),
  dxfs: new StaticXform({ tag: 'dxfs', $: { count: 0 } }),
  tableStyles: new StaticXform({
    tag: 'tableStyles',
    $: { count: 0, defaultTableStyle: 'TableStyleMedium2', defaultPivotStyle: 'PivotStyleLight16' },
  }),
  extLst: new StaticXform({
    tag: 'extLst',
    c: [
      {
        tag: 'ext',
        $: {
          uri: '{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}',
          'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
        },
        c: [{ tag: 'x14:slicerStyles', $: { defaultSlicerStyle: 'SlicerStyleLight1' } }],
      },
      {
        tag: 'ext',
        $: {
          uri: '{9260A510-F301-46a8-8635-F512D64BE5F5}',
          'xmlns:x15': 'http://schemas.microsoft.com/office/spreadsheetml/2010/11/main',
        },
        c: [{ tag: 'x15:timelineStyles', $: { defaultTimelineStyle: 'TimeSlicerStyleLight1' } }],
      },
    ],
  }),
};

// the stylemanager mock acts like StyleManager except that it always returns 0 or {}
class StylesXformMock extends StylesXform {
  constructor() {
    super();

    this.model = {
      styles: [{ numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, xfId: 0 }],
      numFmts: [],
      fonts: [{ size: 11, color: { theme: 1 }, name: 'Calibri', family: 2, scheme: 'minor' }],
      borders: [{}],
      fills: [
        { type: 'pattern', pattern: 'none' },
        { type: 'pattern', pattern: 'gray125' },
      ],
    } as StylesModel;
  }

  // =========================================================================
  // Style Manager Interface

  // override normal behaviour - consume and dispose
  override parseStream(stream: { autodrain(): void }): Promise<void> {
    stream.autodrain();
    return Promise.resolve();
  }

  // add a cell's style model to the collection
  // each style property is processed and cross-referenced, etc.
  // the styleId is returned. Note: cellType is used when numFmt not defined
  override addStyleModel(_model: CellStyleModel, cellType?: number): number {
    switch (cellType) {
      case Enums.ValueType.Date:
        return this.dateStyleId;
      default:
        return 0;
    }
  }

  get dateStyleId() {
    if (!this._dateStyleId) {
      const dateStyle = {
        numFmtId: NumFmtXform.getDefaultFmtId('mm-dd-yy'),
      };
      this._dateStyleId = this.model.styles.length;
      this.model.styles.push(dateStyle as StyleXfModel);
    }
    return this._dateStyleId as number;
  }

  // given a styleId (i.e. s="n"), get the cell's style model
  // objects are shared where possible.
  override getStyleModel(): Record<string, unknown> {
    return {};
  }
}

StylesXform.Mock = StylesXformMock;

export default StylesXform;
