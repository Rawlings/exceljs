import _ from '../../../../utils/helpers/under-dash';

import colCache from '../../../../utils/data/col-cache';
import XmlStream from '../../../../utils/stream/xml-stream';

import RelType from '../../rel-type';

import Merges from './merges';

import BaseXform from '../base-xform';
import ListXform from '../list-xform';
import RowXform from './row-xform';
import ColXform from './col-xform';
import DimensionXform from './dimension-xform';
import HyperlinkXform from './hyperlink-xform';
import MergeCellXform from './merge-cell-xform';
import DataValidationsXform from './data-validations-xform';
import SheetPropertiesXform from './sheet-properties-xform';
import SheetFormatPropertiesXform from './sheet-format-properties-xform';
import SheetViewXform from './sheet-view-xform';
import SheetProtectionXform from './sheet-protection-xform';
import PageMarginsXform from './page-margins-xform';
import PageSetupXform from './page-setup-xform';
import PrintOptionsXform from './print-options-xform';
import AutoFilterXform from './auto-filter-xform';
import PictureXform from './picture-xform';
import DrawingXform from './drawing-xform';
import TablePartXform from './table-part-xform';
import RowBreaksXform from './row-breaks-xform';
import HeaderFooterXform from './header-footer-xform';
import ConditionalFormattingsXform from './cf/conditional-formattings-xform';
import ExtListXform from './ext-lst-xform';
import type { SaxNode } from '../base-xform';
import type { ColModel } from './col-xform';
import type { HyperlinkModel } from './hyperlink-xform';
import type { PictureModel } from './picture-xform';
import type { SheetViewModel } from './sheet-view-xform';
import type { HeaderFooterModel } from './header-footer-xform';
import type { SheetProtectionModel } from './sheet-protection-xform';
import type { AutoFilterModel } from './auto-filter-xform';
import type { DataValidationsModel } from './data-validations-xform';
import type { RelationshipModel } from '../core/relationship-xform';
import type { ColorModel } from '../style/color-xform';
import type { OutlinePropertiesModel } from './outline-properties-xform';
import type { PageSetup } from '../../../../core/worksheet';

interface CfRuleModel {
  x14Id?: string;
  priority?: number;
  [key: string]: unknown;
}

interface CfModel {
  ref?: string;
  rules: CfRuleModel[];
  [key: string]: unknown;
}

const mergeRule = (rule: CfRuleModel, extRule: CfRuleModel) => {
  Object.keys(extRule).forEach((key) => {
    const value = rule[key];
    const extValue = extRule[key];
    if (value === undefined && extValue !== undefined) {
      rule[key] = extValue;
    }
  });
};

const mergeConditionalFormattings = (
  model: CfModel[] | undefined,
  extModel: CfModel[] | undefined
) => {
  // conditional formattings are rendered in worksheet.conditionalFormatting and also in
  // worksheet.extLst.ext.x14:conditionalFormattings
  // some (e.g. dataBar) are even spread across both!
  if (!extModel || !extModel.length) {
    return model;
  }
  if (!model || !model.length) {
    return extModel;
  }

  // index model rules by x14Id
  const cfMap: Record<string, CfModel> = {};
  const ruleMap: Record<string, CfRuleModel> = {};
  model.forEach((cf) => {
    if (cf.ref) cfMap[cf.ref] = cf;
    cf.rules.forEach((rule) => {
      const { x14Id } = rule;
      if (x14Id) {
        ruleMap[x14Id] = rule;
      }
    });
  });

  extModel.forEach((extCf) => {
    extCf.rules.forEach((extRule) => {
      const rule = extRule.x14Id ? ruleMap[extRule.x14Id] : undefined;
      if (rule) {
        // merge with matching rule
        mergeRule(rule, extRule);
      } else if (extCf.ref && cfMap[extCf.ref]) {
        // reuse existing cf ref
        cfMap[extCf.ref].rules.push(extRule);
      } else {
        // create new cf
        model.push({
          ref: extCf.ref,
          rules: [extRule],
        });
      }
    });
  });

  // need to cope with rules in extModel that don't exist in model
  return model;
};

interface RowXformModel {
  cells?: unknown[];
  [key: string]: unknown;
}

interface WorksheetDrawingModel {
  rId?: string;
  name: string;
  anchors: unknown[];
  rels: RelationshipModel[];
}

interface WorksheetMedium {
  type: string;
  imageId?: number;
  range?: unknown;
  hyperlinks?: { tooltip?: string; hyperlink?: string; rId?: string };
}

interface WorksheetTableModel {
  target?: string;
  rId?: string;
  columns: Record<string, unknown>[];
  [key: string]: unknown;
}

interface WorksheetPropertiesModel {
  defaultRowHeight?: number;
  dyDescent?: number;
  outlineLevelCol?: number;
  outlineLevelRow?: number;
  defaultColWidth?: number;
  outlineProperties?: OutlinePropertiesModel;
  tabColor?: ColorModel;
}

export interface WorksheetXformModel {
  [key: string]: unknown;
  id?: number;
  sheetNo?: number | string;
  dimensions?: unknown;
  cols?: ColModel[];
  rows?: RowXformModel[];
  mergeCells?: string[];
  hyperlinks?: HyperlinkModel[];
  dataValidations?: DataValidationsModel;
  properties?: WorksheetPropertiesModel;
  views?: SheetViewModel[];
  pageSetup?: Partial<PageSetup>;
  headerFooter?: HeaderFooterModel;
  background?: PictureModel;
  image?: unknown;
  drawing?: WorksheetDrawingModel;
  tables?: WorksheetTableModel[];
  conditionalFormattings?: CfModel[];
  autoFilter?: AutoFilterModel;
  sheetProtection?: SheetProtectionModel;
  relationships?: RelationshipModel[];
  comments?: unknown[];
  media?: WorksheetMedium[];
  rels?: RelationshipModel[];
  pivotTables?: unknown[];
}

// prepare() and reconcile() are called from opposite ends of the pipeline
// (write-prepare vs. read-reconcile, see xlsx.ts) with differently-shaped
// options bags that happen to share a couple of field names with different
// meaning (e.g. `comments`: a fresh array being built vs. a lookup hash).
interface WorksheetPrepareOptions {
  [key: string]: unknown;
  merges?: Merges;
  hyperlinks?: HyperlinkModel[];
  comments?: unknown[];
  formulae?: Record<string, unknown>;
  siFormulae?: number;
  media?: unknown;
  drawingsCount?: number;
  drawings?: WorksheetDrawingModel[];
  commentRefs?: unknown[];
  styles?: { addDxfStyle(style: Record<string, unknown>): number };
}

interface WorksheetReconcileOptions {
  [key: string]: unknown;
  comments?: Record<string, { comments: unknown[] }>;
  vmlDrawings?: Record<string, { comments: unknown[] }>;
  drawings?: Record<string, WorksheetDrawingModel>;
  mediaIndex?: Record<string, number>;
  tables?: Record<string, WorksheetTableModel>;
  formulae?: Record<string, unknown>;
  commentsMap?: Record<string, unknown>;
  hyperlinkMap?: Record<string, string>;
}

class WorkSheetXform extends BaseXform {
  static WORKSHEET_ATTRIBUTES: Record<string, string>;
  ignoreNodes: string[];
  preImageId: unknown;
  // Individually-typed access to specific xforms below still goes through
  // this.map.<name>, which TS resolves structurally from the object
  // literal assigned in the constructor; this looser declaration is only
  // used for the handful of call sites that iterate/index generically.
  declare map: Record<string, BaseXform>;

  constructor(options?: { maxRows?: number; maxCols?: number; ignoreNodes?: string[] }) {
    super();

    const { maxRows, maxCols, ignoreNodes } = options || {};

    this.ignoreNodes = ignoreNodes || [];

    this.map = {
      sheetPr: new SheetPropertiesXform(),
      dimension: new DimensionXform(),
      sheetViews: new ListXform({
        tag: 'sheetViews',
        count: false,
        childXform: new SheetViewXform(),
      }),
      sheetFormatPr: new SheetFormatPropertiesXform(),
      cols: new ListXform({ tag: 'cols', count: false, childXform: new ColXform() }),
      sheetData: new ListXform({
        tag: 'sheetData',
        count: false,
        empty: true,
        childXform: new RowXform({ maxItems: maxCols }),
        maxItems: maxRows,
      }),
      autoFilter: new AutoFilterXform(),
      mergeCells: new ListXform({
        tag: 'mergeCells',
        count: true,
        childXform: new MergeCellXform(),
      }),
      rowBreaks: new RowBreaksXform(),
      hyperlinks: new ListXform({
        tag: 'hyperlinks',
        count: false,
        childXform: new HyperlinkXform(),
      }),
      pageMargins: new PageMarginsXform(),
      dataValidations: new DataValidationsXform(),
      pageSetup: new PageSetupXform(),
      headerFooter: new HeaderFooterXform(),
      printOptions: new PrintOptionsXform(),
      picture: new PictureXform(),
      drawing: new DrawingXform(),
      sheetProtection: new SheetProtectionXform(),
      tableParts: new ListXform({
        tag: 'tableParts',
        count: true,
        childXform: new TablePartXform(),
      }),
      conditionalFormatting: new ConditionalFormattingsXform(),
      extLst: new ExtListXform(),
    };
  }

override prepare(model: WorksheetXformModel, options: WorksheetPrepareOptions) {
    const merges = new Merges();
    options.merges = merges;
    const hyperlinks: HyperlinkModel[] = [];
    model.hyperlinks = options.hyperlinks = hyperlinks;
    const comments: unknown[] = [];
    model.comments = options.comments = comments;

    options.formulae = {};
    options.siFormulae = 0;
    this.map.cols.prepare(model.cols, options);
    this.map.sheetData.prepare(model.rows, options);
    this.map.conditionalFormatting.prepare(model.conditionalFormattings, options);

    model.mergeCells = merges.mergeCells;

    // prepare relationships
    const rels: RelationshipModel[] = (model.rels = []);

    function nextRid(r: unknown[]) {
      return `rId${r.length + 1}`;
    }

    hyperlinks.forEach((hyperlink) => {
      const rId = nextRid(rels);
      hyperlink.rId = rId;
      rels.push({
        Id: rId,
        Type: RelType.Hyperlink,
        Target: hyperlink.target as string,
        TargetMode: 'External',
      });
    });

    // prepare comment relationships
    if (comments.length > 0) {
      const comment = {
        Id: nextRid(rels),
        Type: RelType.Comments,
        Target: `../comments${model.id}.xml`,
      };
      rels.push(comment);
      const vmlDrawing = {
        Id: nextRid(rels),
        Type: RelType.VmlDrawing,
        Target: `../drawings/vmlDrawing${model.id}.vml`,
      };
      rels.push(vmlDrawing);

      (comments as Array<{ ref: string; refAddress?: unknown }>).forEach((item) => {
        item.refAddress = colCache.decodeAddress(item.ref);
      });

      (options.commentRefs as unknown[]).push({
        commentName: `comments${model.id}`,
        vmlDrawing: `vmlDrawing${model.id}`,
      });
    }

    interface BookImage {
      name: string;
      extension: string;
    }
    const media = options.media as BookImage[];
    const drawingRelsHash: Record<string, string> = {};
    let bookImage: BookImage;
    (model.media || []).forEach((medium) => {
      if (medium.type === 'background') {
        const rId = nextRid(rels);
        bookImage = media[medium.imageId as number];
        rels.push({
          Id: rId,
          Type: RelType.Image,
          Target: `../media/${bookImage.name}.${bookImage.extension}`,
        });
        model.background = {
          rId,
        };
        model.image = media[medium.imageId as number];
      } else if (medium.type === 'image') {
        let { drawing } = model;
        bookImage = media[medium.imageId as number];
        if (!drawing) {
          drawing = model.drawing = {
            rId: nextRid(rels),
            name: `drawing${++(options.drawingsCount as number)}`,
            anchors: [],
            rels: [],
          };
          (options.drawings as WorksheetDrawingModel[]).push(drawing);
          rels.push({
            Id: drawing.rId as string,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing',
            Target: `../drawings/${drawing.name}.xml`,
          });
        }
        let rIdImage =
          this.preImageId === medium.imageId
            ? drawingRelsHash[medium.imageId as number]
            : drawingRelsHash[drawing.rels.length];
        if (!rIdImage) {
          rIdImage = nextRid(drawing.rels);
          drawingRelsHash[drawing.rels.length] = rIdImage;
          drawing.rels.push({
            Id: rIdImage,
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            Target: `../media/${bookImage.name}.${bookImage.extension}`,
          });
        }

        const anchor: {
          picture: { rId: string; hyperlinks?: { tooltip?: string; rId: string } };
          range: unknown;
        } = {
          picture: {
            rId: rIdImage,
          },
          range: medium.range,
        };
        if (medium.hyperlinks && medium.hyperlinks.hyperlink) {
          const rIdHyperLink = nextRid(drawing.rels);
          drawingRelsHash[drawing.rels.length] = rIdHyperLink;
          anchor.picture.hyperlinks = {
            tooltip: medium.hyperlinks.tooltip,
            rId: rIdHyperLink,
          };
          drawing.rels.push({
            Id: rIdHyperLink,
            Type: RelType.Hyperlink,
            Target: medium.hyperlinks.hyperlink,
            TargetMode: 'External',
          });
        }
        this.preImageId = medium.imageId;
        drawing.anchors.push(anchor);
      }
    });

    // prepare tables
    (model.tables || []).forEach((table) => {
      // relationships
      const rId = nextRid(rels);
      table.rId = rId;
      rels.push({
        Id: rId,
        Type: RelType.Table,
        Target: `../tables/${table.target}`,
      });

      // dynamic styles
      table.columns.forEach((column) => {
        const { style } = column;
        if (style) {
          column.dxfId = options.styles!.addDxfStyle(style as Record<string, unknown>);
        }
      });
    });

    // prepare pivot tables
    if ((model.pivotTables || []).length) {
      rels.push({
        Id: nextRid(rels),
        Type: RelType.PivotTable,
        Target: '../pivotTables/pivotTable1.xml',
      });
    }

    // prepare ext items
    this.map.extLst.prepare(model, options);
  }

  override render(xmlStream: XmlStream, model: WorksheetXformModel) {
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('worksheet', WorkSheetXform.WORKSHEET_ATTRIBUTES);

    const sheetFormatPropertiesModel: Record<string, unknown> | undefined = model.properties
      ? {
          defaultRowHeight: model.properties.defaultRowHeight,
          dyDescent: model.properties.dyDescent,
          outlineLevelCol: model.properties.outlineLevelCol,
          outlineLevelRow: model.properties.outlineLevelRow,
        }
      : undefined;
    if (sheetFormatPropertiesModel && model.properties && model.properties.defaultColWidth) {
      sheetFormatPropertiesModel.defaultColWidth = model.properties.defaultColWidth;
    }
    const sheetPropertiesModel = {
      outlineProperties: model.properties && model.properties.outlineProperties,
      tabColor: model.properties && model.properties.tabColor,
      pageSetup:
        model.pageSetup && model.pageSetup.fitToPage
          ? {
              fitToPage: model.pageSetup.fitToPage,
            }
          : undefined,
    };
    const pageMarginsModel = model.pageSetup && model.pageSetup.margins;
    const printOptionsModel = {
      showRowColHeaders: model.pageSetup && model.pageSetup.showRowColHeaders,
      showGridLines: model.pageSetup && model.pageSetup.showGridLines,
      horizontalCentered: model.pageSetup && model.pageSetup.horizontalCentered,
      verticalCentered: model.pageSetup && model.pageSetup.verticalCentered,
    };
    const sheetProtectionModel = model.sheetProtection;

    this.map.sheetPr.render(xmlStream, sheetPropertiesModel);
    this.map.dimension.render(xmlStream, model.dimensions);
    this.map.sheetViews.render(xmlStream, model.views);
    this.map.sheetFormatPr.render(xmlStream, sheetFormatPropertiesModel);
    this.map.cols.render(xmlStream, model.cols);
    this.map.sheetData.render(xmlStream, model.rows);
    this.map.sheetProtection.render(xmlStream, sheetProtectionModel); // Note: must be after sheetData and before autoFilter
    this.map.autoFilter.render(xmlStream, model.autoFilter);
    this.map.mergeCells.render(xmlStream, model.mergeCells);
    this.map.conditionalFormatting.render(xmlStream, model.conditionalFormattings); // Note: must be before dataValidations
    this.map.dataValidations.render(xmlStream, model.dataValidations);

    // For some reason hyperlinks have to be after the data validations
    this.map.hyperlinks.render(xmlStream, model.hyperlinks);

    this.map.rowBreaks.render(xmlStream, model.rowBreaks);
    this.map.printOptions.render(xmlStream, printOptionsModel); // Note: must be before pageMargins
    this.map.pageMargins.render(xmlStream, pageMarginsModel);
    this.map.pageSetup.render(xmlStream, model.pageSetup);
    this.map.headerFooter.render(xmlStream, model.headerFooter);
    this.map.drawing.render(xmlStream, model.drawing); // Note: must be after rowBreaks
    this.map.picture.render(xmlStream, model.background); // Note: must be after drawing
    this.map.tableParts.render(xmlStream, model.tables);

    this.map.extLst.render(xmlStream, model);

    if (model.rels) {
      // add a <legacyDrawing /> node for each comment
      model.rels.forEach((rel) => {
        if (rel.Type === RelType.VmlDrawing) {
          xmlStream.leafNode('legacyDrawing', { 'r:id': rel.Id });
        }
      });
    }

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    if (node.name === 'worksheet') {
      _.each(this.map, (xform) => {
        xform.reset();
      });
      return true;
    }

    if (this.map[node.name] && !this.ignoreNodes.includes(node.name)) {
      this.parser = this.map[node.name];
      this.parser.parseOpen(node);
    }
    return true;
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
      case 'worksheet': {
        const properties = this.map.sheetFormatPr.model || {};
        if (this.map.sheetPr.model && this.map.sheetPr.model.tabColor) {
          properties.tabColor = this.map.sheetPr.model.tabColor;
        }
        if (this.map.sheetPr.model && this.map.sheetPr.model.outlineProperties) {
          properties.outlineProperties = this.map.sheetPr.model.outlineProperties;
        }
        const sheetProperties = {
          fitToPage:
            (this.map.sheetPr.model &&
              this.map.sheetPr.model.pageSetup &&
              this.map.sheetPr.model.pageSetup.fitToPage) ||
            false,
          margins: this.map.pageMargins.model,
        };
        const pageSetup = Object.assign(
          sheetProperties,
          this.map.pageSetup.model,
          this.map.printOptions.model
        );
        const conditionalFormattings = mergeConditionalFormattings(
          this.map.conditionalFormatting.model,
          this.map.extLst.model && this.map.extLst.model['x14:conditionalFormattings']
        );
        this.model = {
          dimensions: this.map.dimension.model,
          cols: this.map.cols.model,
          rows: this.map.sheetData.model,
          mergeCells: this.map.mergeCells.model,
          hyperlinks: this.map.hyperlinks.model,
          dataValidations: this.map.dataValidations.model,
          properties,
          views: this.map.sheetViews.model,
          pageSetup,
          headerFooter: this.map.headerFooter.model,
          background: this.map.picture.model,
          drawing: this.map.drawing.model,
          tables: this.map.tableParts.model,
          conditionalFormattings,
        };

        if (this.map.autoFilter.model) {
          this.model.autoFilter = this.map.autoFilter.model;
        }
        if (this.map.sheetProtection.model) {
          this.model.sheetProtection = this.map.sheetProtection.model;
        }

        return false;
      }

      default:
        // not quite sure how we get here!
        return true;
    }
  }

  override reconcile(model: WorksheetXformModel, options: WorksheetReconcileOptions) {
    // options.merges = new Merges();
    // options.merges.reconcile(model.mergeCells, model.rows);
    const rels = (model.relationships || []).reduce<Record<string, RelationshipModel>>(
      (h, rel) => {
        if (rel.Id) h[rel.Id] = rel;
        if (rel.Type === RelType.Comments) {
          model.comments = options.comments?.[rel.Target]?.comments || [];
        }
        if (rel.Type === RelType.VmlDrawing && model.comments && model.comments.length) {
          const vmlComment = options.vmlDrawings?.[rel.Target]?.comments || [];
          (model.comments as Array<{ note?: Record<string, unknown> }>).forEach(
            (comment, index) => {
              comment.note = Object.assign({}, comment.note, vmlComment[index]);
            }
          );
        }
        return h;
      },
      {}
    );
    options.commentsMap = (model.comments as Array<{ ref?: string }> | undefined || []).reduce<
      Record<string, unknown>
    >((h, comment) => {
      if (comment.ref) {
        h[comment.ref] = comment;
      }
      return h;
    }, {});
    options.hyperlinkMap = (model.hyperlinks || []).reduce<Record<string, string>>(
      (h, hyperlink) => {
        if (hyperlink.rId && hyperlink.address) {
          h[hyperlink.address] = rels[hyperlink.rId].Target;
        }
        return h;
      },
      {}
    );
    options.formulae = {};

    // compact the rows and cells
    model.rows = (model.rows && model.rows.filter(Boolean)) || [];
    model.rows.forEach((row) => {
      row.cells = (row.cells && row.cells.filter(Boolean)) || [];
    });

    this.map.cols.reconcile(model.cols, options);
    this.map.sheetData.reconcile(model.rows, options);
    this.map.conditionalFormatting.reconcile(model.conditionalFormattings, options);

    const media: WorksheetMedium[] = (model.media = []);
    if (model.drawing) {
      const drawingRel = rels[model.drawing.rId as string];
      const match = drawingRel.Target.match(/\/drawings\/([a-zA-Z0-9]+)[.][a-zA-Z]{3,4}$/);
      if (match) {
        const drawingName = match[1];
        const drawing = options.drawings?.[drawingName] as
          | { anchors: Array<{ medium?: { index?: number }; range?: unknown; picture?: { hyperlinks?: unknown } }> }
          | undefined;
        drawing?.anchors.forEach((anchor) => {
          if (anchor.medium) {
            const image: WorksheetMedium = {
              type: 'image',
              imageId: anchor.medium.index,
              range: anchor.range,
              hyperlinks: anchor.picture?.hyperlinks as WorksheetMedium['hyperlinks'],
            };
            media.push(image);
          }
        });
      }
    }

    const backgroundRel = model.background && rels[model.background.rId];
    if (backgroundRel) {
      const target = backgroundRel.Target.split('/media/')[1];
      const imageId = options.mediaIndex && options.mediaIndex[target];
      if (imageId !== undefined) {
        media.push({
          type: 'background',
          imageId,
        });
      }
    }

    model.tables = (model.tables || [])
      .map((tablePart) => {
        const rel = rels[tablePart.rId as string];
        return options.tables?.[rel.Target];
      })
      .filter((table): table is WorksheetTableModel => Boolean(table));

    delete model.relationships;
    delete model.hyperlinks;
    delete (model as Record<string, unknown>).comments;
  }
}

WorkSheetXform.WORKSHEET_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  'mc:Ignorable': 'x14ac',
  'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
};

export default WorkSheetXform;
