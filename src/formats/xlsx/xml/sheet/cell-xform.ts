import utils from '../../../../utils/helpers/utils';
import BaseXform from '../base-xform';
import Range from '../../../../core/range';
import Enums from '../../../../core/enums';

import RichTextXform from '../strings/rich-text-xform';
import type { RichTextRunModel } from '../strings/rich-text-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

// Mirrors the runtime shape of a cell as it flows through prepare/render/
// reconcile: fields get added, mutated and deleted as the value type is
// pinned down, so this stays a flexible bag rather than a discriminated
// union (CellValue in src/core/cell.ts is the real, precise public type).
export interface CellXformModel {
  [key: string]: unknown;
  address?: string;
  type?: number;
  value?: unknown;
  result?: unknown;
  formula?: string;
  sharedFormula?: string;
  shareType?: string;
  si?: number;
  ref?: string;
  range?: { range?: unknown; expandToAddress(address: string): void; address?: string } | Range;
  style?: Record<string, unknown>;
  styleId?: number;
  ssId?: number;
  date1904?: boolean;
  comment?: Record<string, unknown>;
  hyperlink?: string;
  text?: unknown;
  tooltip?: string;
}

interface StyleManagerLike {
  addStyleModel(style: Record<string, unknown>, effectiveType?: unknown): number;
  getStyleModel(id: number): Record<string, unknown>;
}

interface SharedStringsLike {
  add(value: unknown): number;
  getString(id: number): unknown;
}

export interface CellXformOptions {
  [key: string]: unknown;
  styles?: StyleManagerLike;
  comments?: Record<string, unknown>[];
  sharedStrings?: SharedStringsLike;
  date1904?: boolean;
  hyperlinks?: Record<string, unknown>[];
  merges?: { add(model: unknown): void };
  formulae?: Record<string, CellXformModel>;
  siFormulae: number;
}

// reconcile() is called from the opposite end of the pipeline (read path,
// see WorksheetReconcileOptions in worksheet-xform.ts) with a differently
// shaped `formulae` (si -> address, not address -> model).
export interface CellReconcileOptions {
  [key: string]: unknown;
  styles?: { getStyleModel(id: number): Record<string, unknown> & { numFmt?: string } };
  sharedStrings?: SharedStringsLike;
  date1904?: boolean;
  formulae?: Record<string, string>;
  hyperlinkMap?: Record<string, string>;
  commentsMap?: Record<string, Record<string, unknown>>;
}

function getValueType(v: unknown) {
  if (v === null || v === undefined) {
    return Enums.ValueType.Null;
  }
  if (v instanceof String || typeof v === 'string') {
    return Enums.ValueType.String;
  }
  if (typeof v === 'number') {
    return Enums.ValueType.Number;
  }
  if (typeof v === 'boolean') {
    return Enums.ValueType.Boolean;
  }
  if (v instanceof Date) {
    return Enums.ValueType.Date;
  }
  const obj = v as Record<string, unknown>;
  if (obj.text && obj.hyperlink) {
    return Enums.ValueType.Hyperlink;
  }
  if (obj.formula) {
    return Enums.ValueType.Formula;
  }
  if (obj.error) {
    return Enums.ValueType.Error;
  }
  throw new Error('I could not understand type of value');
}

function getEffectiveCellType(cell: CellXformModel) {
  switch (cell.type) {
    case Enums.ValueType.Formula:
      return getValueType(cell.result);
    default:
      return cell.type;
  }
}

class CellXform extends BaseXform {
  richTextXForm: RichTextXform;
  t: string | undefined;
  currentNode: string | undefined;

  constructor() {
    super();

    this.richTextXForm = new RichTextXform();
  }

  override get tag() {
    return 'c';
  }

  override prepare(model: CellXformModel, options: CellXformOptions) {
    const styleId = options.styles!.addStyleModel(
      model.style || {},
      getEffectiveCellType(model)
    );
    if (styleId) {
      model.styleId = styleId;
    }

    if (model.comment) {
      options.comments!.push({ ...model.comment, ref: model.address });
    }

    switch (model.type) {
      case Enums.ValueType.String:
      case Enums.ValueType.RichText:
        if (options.sharedStrings) {
          model.ssId = options.sharedStrings.add(model.value);
        }
        break;

      case Enums.ValueType.Date:
        if (options.date1904) {
          model.date1904 = true;
        }
        break;

      case Enums.ValueType.Hyperlink:
        if (options.sharedStrings && model.text !== undefined && model.text !== null) {
          model.ssId = options.sharedStrings.add(model.text);
        }
        options.hyperlinks!.push({
          address: model.address,
          target: model.hyperlink,
          tooltip: model.tooltip,
        });
        break;

      case Enums.ValueType.Merge:
        options.merges!.add(model);
        break;

      case Enums.ValueType.Formula:
        if (options.date1904) {
          // in case valueType is date
          model.date1904 = true;
        }

        if (model.shareType === 'shared') {
          model.si = options.siFormulae++;
        }

        if (model.formula) {
          options.formulae![model.address as string] = model;
        } else if (model.sharedFormula) {
          const master = options.formulae![model.sharedFormula];
          if (!master) {
            throw new Error(
              `Shared Formula master must exist above and or left of clone for cell ${model.address}`
            );
          }
          if (master.si === undefined) {
            master.shareType = 'shared';
            master.si = options.siFormulae++;
            master.range = new Range(master.address as string, model.address as string);
          } else if (master.range) {
            (master.range as Range).expandToAddress(model.address as string);
          }
          model.si = master.si;
        }
        break;

      default:
        break;
    }
  }

  renderFormula(xmlStream: XmlStream, model: CellXformModel) {
    let attrs: Record<string, unknown> | undefined;
    switch (model.shareType) {
      case 'shared':
        attrs = {
          t: 'shared',
          ref: model.ref || model.range?.range,
          si: model.si,
        };
        break;

      case 'array':
        attrs = {
          t: 'array',
          ref: model.ref,
        };
        break;

      default:
        if (model.si !== undefined) {
          attrs = {
            t: 'shared',
            si: model.si,
          };
        }
        break;
    }

    switch (getValueType(model.result)) {
      case Enums.ValueType.Null: // ?
        xmlStream.leafNode('f', attrs, model.formula);
        break;

      case Enums.ValueType.String:
        // oddly, formula results don't ever use shared strings
        xmlStream.addAttribute('t', 'str');
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', undefined, model.result);
        break;

      case Enums.ValueType.Number:
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', undefined, model.result);
        break;

      case Enums.ValueType.Boolean:
        xmlStream.addAttribute('t', 'b');
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', undefined, model.result ? 1 : 0);
        break;

      case Enums.ValueType.Error:
        xmlStream.addAttribute('t', 'e');
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode('v', undefined, (model.result as { error?: unknown }).error);
        break;

      case Enums.ValueType.Date:
        xmlStream.leafNode('f', attrs, model.formula);
        xmlStream.leafNode(
          'v',
          undefined,
          utils.dateToExcel(model.result as Date, model.date1904)
        );
        break;

      // case Enums.ValueType.Hyperlink: // ??
      // case Enums.ValueType.Formula:
      default:
        throw new Error('I could not understand type of value');
    }
  }

  override render(xmlStream: XmlStream, model: CellXformModel) {
    if (model.type === Enums.ValueType.Null && !model.styleId) {
      // if null and no style, exit
      return;
    }

    xmlStream.openNode('c');
    xmlStream.addAttribute('r', model.address);

    if (model.styleId) {
      xmlStream.addAttribute('s', model.styleId);
    }

    switch (model.type) {
      case Enums.ValueType.Null:
        break;

      case Enums.ValueType.Number:
        xmlStream.leafNode('v', undefined, model.value);
        break;

      case Enums.ValueType.Boolean:
        xmlStream.addAttribute('t', 'b');
        xmlStream.leafNode('v', undefined, model.value ? '1' : '0');
        break;

      case Enums.ValueType.Error:
        xmlStream.addAttribute('t', 'e');
        xmlStream.leafNode('v', undefined, (model.value as { error?: unknown }).error);
        break;

      case Enums.ValueType.String:
      case Enums.ValueType.RichText: {
        const richValue = model.value as { richText?: RichTextRunModel[] } | undefined;
        if (model.ssId !== undefined) {
          xmlStream.addAttribute('t', 's');
          xmlStream.leafNode('v', undefined, model.ssId);
        } else if (richValue && richValue.richText) {
          xmlStream.addAttribute('t', 'inlineStr');
          xmlStream.openNode('is');
          richValue.richText.forEach((text) => {
            this.richTextXForm.render(xmlStream, text);
          });
          xmlStream.closeNode();
        } else {
          xmlStream.addAttribute('t', 'str');
          xmlStream.leafNode('v', undefined, model.value);
        }
        break;
      }

      case Enums.ValueType.Date:
        xmlStream.leafNode(
          'v',
          undefined,
          utils.dateToExcel(model.value as Date, model.date1904)
        );
        break;

      case Enums.ValueType.Hyperlink:
        if (model.ssId !== undefined) {
          xmlStream.addAttribute('t', 's');
          xmlStream.leafNode('v', undefined, model.ssId);
        } else {
          xmlStream.addAttribute('t', 'str');
          xmlStream.leafNode('v', undefined, model.text);
        }
        break;

      case Enums.ValueType.Formula:
        this.renderFormula(xmlStream, model);
        break;

      case Enums.ValueType.Merge:
        // nothing to add
        break;

      default:
        break;
    }

    xmlStream.closeNode(); // </c>
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    const attrs = node.attributes as Record<string, string>;
    switch (node.name) {
      case 'c':
        // const address = colCache.decodeAddress(node.attributes.r);
        this.model = {
          address: attrs.r,
        };
        this.t = attrs.t;
        if (attrs.s) {
          this.model.styleId = parseInt(attrs.s, 10);
        }
        return true;

      case 'f':
        this.currentNode = 'f';
        this.model.si = attrs.si;
        this.model.shareType = attrs.t;
        this.model.ref = attrs.ref;
        return true;

      case 'v':
        this.currentNode = 'v';
        return true;

      case 't':
        this.currentNode = 't';
        return true;

      case 'r':
        this.parser = this.richTextXForm;
        this.parser.parseOpen(node);
        return true;

      default:
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
      return;
    }
    switch (this.currentNode) {
      case 'f':
        this.model.formula = this.model.formula ? this.model.formula + text : text;
        break;
      case 'v':
      case 't':
        if (this.model.value && this.model.value.richText) {
          this.model.value.richText.text = this.model.value.richText.text
            ? this.model.value.richText.text + text
            : text;
        } else {
          this.model.value = this.model.value ? this.model.value + text : text;
        }
        break;
      default:
        break;
    }
  }

  override parseClose(name: string): boolean {
    switch (name) {
      case 'c': {
        const { model } = this;

        // first guess on cell type
        if (model.formula || model.shareType) {
          model.type = Enums.ValueType.Formula;
          if (model.value) {
            if (this.t === 'str') {
              model.result = utils.xmlDecode(model.value);
            } else if (this.t === 'b') {
              model.result = parseInt(model.value, 10) !== 0;
            } else if (this.t === 'e') {
              model.result = { error: model.value };
            } else {
              model.result = parseFloat(model.value);
            }
            model.value = undefined;
          }
        } else if (model.value !== undefined) {
          switch (this.t) {
            case 's':
              model.type = Enums.ValueType.String;
              model.value = parseInt(model.value, 10);
              break;
            case 'str':
              model.type = Enums.ValueType.String;
              model.value = utils.xmlDecode(model.value);
              break;
            case 'inlineStr':
              model.type = Enums.ValueType.String;
              break;
            case 'b':
              model.type = Enums.ValueType.Boolean;
              model.value = parseInt(model.value, 10) !== 0;
              break;
            case 'e':
              model.type = Enums.ValueType.Error;
              model.value = { error: model.value };
              break;
            default:
              model.type = Enums.ValueType.Number;
              model.value = parseFloat(model.value);
              break;
          }
        } else if (model.styleId) {
          model.type = Enums.ValueType.Null;
        } else {
          model.type = Enums.ValueType.Merge;
        }
        return false;
      }

      case 'f':
      case 'v':
      case 'is':
        this.currentNode = undefined;
        return true;

      case 't':
        if (this.parser) {
          this.parser.parseClose(name);
          return true;
        }
        this.currentNode = undefined;
        return true;

      case 'r':
        this.model.value = this.model.value || {};
        this.model.value.richText = this.model.value.richText || [];
        this.model.value.richText.push(this.parser.model);
        this.parser = undefined;
        this.currentNode = undefined;
        return true;

      default:
        if (this.parser) {
          this.parser.parseClose(name);
          return true;
        }
        return false;
    }
  }

  override reconcile(model: CellXformModel, options: CellReconcileOptions) {
    const style =
      model.styleId !== undefined && options.styles
        ? options.styles.getStyleModel(model.styleId)
        : undefined;
    if (style) {
      model.style = style;
    }
    if (model.styleId !== undefined) {
      delete model.styleId;
    }

    switch (model.type) {
      case Enums.ValueType.String:
        if (typeof model.value === 'number') {
          if (options.sharedStrings) {
            model.value = options.sharedStrings.getString(model.value);
          }
        }
        if ((model.value as { richText?: unknown })?.richText) {
          model.type = Enums.ValueType.RichText;
        }
        break;

      case Enums.ValueType.Number:
        if (style && utils.isDateFmt(style.numFmt || '')) {
          model.type = Enums.ValueType.Date;
          model.value = utils.excelToDate(model.value as number, options.date1904);
        }
        break;

      case Enums.ValueType.Formula:
        if (model.result !== undefined && style && utils.isDateFmt(style.numFmt || '')) {
          model.result = utils.excelToDate(model.result as number, options.date1904);
        }
        if (model.shareType === 'shared') {
          if (model.ref) {
            // master
            options.formulae![model.si as number] = model.address as string;
          } else {
            // slave
            model.sharedFormula = options.formulae![model.si as number];
            delete model.shareType;
          }
          delete model.si;
        }
        break;

      default:
        break;
    }

    // look for hyperlink
    const hyperlink = options.hyperlinkMap?.[model.address as string];
    if (hyperlink) {
      if (model.type === Enums.ValueType.Formula) {
        model.text = model.result;
        model.result = undefined;
      } else {
        model.text = model.value;
        model.value = undefined;
      }
      model.type = Enums.ValueType.Hyperlink;
      model.hyperlink = hyperlink;
    }

    const comment = options.commentsMap && options.commentsMap[model.address as string];
    if (comment) {
      model.comment = comment;
    }
  }
}

export default CellXform;
