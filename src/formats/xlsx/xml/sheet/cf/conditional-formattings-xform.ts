import BaseXform from '../../base-xform';

import ConditionalFormattingXform, {
  type ConditionalFormattingModel,
} from './conditional-formatting-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

class ConditionalFormattingsXform extends BaseXform {
  cfXform: ConditionalFormattingXform;

  constructor() {
    super();

    this.cfXform = new ConditionalFormattingXform();
  }

  override get tag() {
    return 'conditionalFormatting';
  }

  override reset() {
    this.model = [];
  }

  override prepare(
    model: ConditionalFormattingModel[],
    options: { styles: { addDxfStyle(style: Record<string, unknown>): number } }
  ) {
    // ensure each rule has a priority value
    let nextPriority = model.reduce(
      (p: number, cf) => Math.max(p, ...cf.rules.map((rule) => rule.priority || 0)),
      1
    );
    model.forEach((cf) => {
      cf.rules.forEach((rule) => {
        if (!rule.priority) {
          rule.priority = nextPriority++;
        }

        if (rule.style) {
          rule.dxfId = options.styles.addDxfStyle(rule.style);
        }
      });
    });
  }

  override render(xmlStream: XmlStream, model: ConditionalFormattingModel[]) {
    model.forEach((cf) => {
      this.cfXform.render(xmlStream, cf);
    });
  }

  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case 'conditionalFormatting':
        this.parser = this.cfXform;
        this.parser.parseOpen(node);
        return true;

      default:
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.push(this.parser.model);
        this.parser = undefined;
        return false;
      }
      return true;
    }
    return false;
  }

  override reconcile(
    model: ConditionalFormattingModel[],
    options: { styles: { getDxfStyle(id: number): Record<string, unknown> } }
  ) {
    model.forEach((cf) => {
      cf.rules.forEach((rule) => {
        if (rule.dxfId !== undefined) {
          rule.style = options.styles.getDxfStyle(rule.dxfId);
          delete rule.dxfId;
        }
      });
    });
  }
}

export default ConditionalFormattingsXform;
