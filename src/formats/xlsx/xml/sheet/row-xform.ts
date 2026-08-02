import BaseXform from '../base-xform';
import utils from '../../../../utils/helpers/utils';

import CellXform from './cell-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class RowXform extends BaseXform {
  maxItems: number | undefined;
  numRowsSeen: number | undefined;

  constructor(options?: { maxItems?: number }) {
    super();

    this.maxItems = options && options.maxItems;
    this.map = {
      c: new CellXform(),
    };
  }

  override get tag() {
    return 'row';
  }

  override prepare(model: any, options: any) {
    const styleId = options.styles.addStyleModel(model.style);
    if (styleId) {
      model.styleId = styleId;
    }
    const cellXform = this.map.c;
    model.cells.forEach((cellModel: any) => {
      cellXform.prepare(cellModel, options);
    });
  }

  override render(xmlStream: XmlStream, model: any, options: any) {
    xmlStream.openNode('row');
    xmlStream.addAttribute('r', model.number);
    if (model.height) {
      xmlStream.addAttribute('ht', model.height);
      xmlStream.addAttribute('customHeight', '1');
    }
    if (model.hidden) {
      xmlStream.addAttribute('hidden', '1');
    }
    if (model.min > 0 && model.max > 0 && model.min <= model.max) {
      xmlStream.addAttribute('spans', `${model.min}:${model.max}`);
    }
    if (model.styleId) {
      xmlStream.addAttribute('s', model.styleId);
      xmlStream.addAttribute('customFormat', '1');
    }
    if (model.outlineLevel) {
      xmlStream.addAttribute('outlineLevel', model.outlineLevel);
    }
    if (model.collapsed) {
      xmlStream.addAttribute('collapsed', '1');
    }
    xmlStream.addAttribute('x14ac:dyDescent', '0.25');

    const cellXform = this.map.c;
    model.cells.forEach((cellModel: any) => {
      cellXform.render(xmlStream, cellModel, options);
    });

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    const attrs = node.attributes as Record<string, string>;
    if (node.name === 'row') {
      this.numRowsSeen = (this.numRowsSeen as number) + 1;
      const spans = attrs.spans
        ? attrs.spans.split(':').map((span: string) => parseInt(span, 10))
        : [undefined, undefined];
      const model: any = (this.model = {
        number: parseInt(attrs.r, 10),
        min: spans[0],
        max: spans[1],
        cells: [],
      });
      if (attrs.s) {
        model.styleId = parseInt(attrs.s, 10);
      }
      if (utils.parseBoolean(attrs.hidden)) {
        model.hidden = true;
      }
      if (utils.parseBoolean(attrs.bestFit)) {
        model.bestFit = true;
      }
      if (attrs.ht) {
        model.height = parseFloat(attrs.ht);
      }
      if (attrs.outlineLevel) {
        model.outlineLevel = parseInt(attrs.outlineLevel, 10);
      }
      if (utils.parseBoolean(attrs.collapsed)) {
        model.collapsed = true;
      }
      return true;
    }

    this.parser = this.map[node.name];
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    return false;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.cells.push(this.parser.model);
        if (this.maxItems && this.model.cells.length > this.maxItems) {
          throw new Error(`Max column count (${this.maxItems}) exceeded`);
        }
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }

  override reconcile(model: any, options: any) {
    model.style = model.styleId ? options.styles.getStyleModel(model.styleId) : {};
    if (model.styleId !== undefined) {
      model.styleId = undefined;
    }

    const cellXform = this.map.c;
    model.cells.forEach((cellModel: any) => {
      cellXform.reconcile(cellModel, options);
    });
  }
}

export default RowXform;
