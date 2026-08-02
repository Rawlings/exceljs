import BaseXform from '../../base-xform';

import ConditionalFormattingXform from './conditional-formatting-xform';

class ConditionalFormattingsXform extends BaseXform {
  cfXform: any;

  constructor() {
    super();

    this.cfXform = new ConditionalFormattingXform();
  }

  get tag() {
    return 'conditionalFormatting';
  }

  reset() {
    this.model = [];
  }

  prepare(model: any, options: any) {
    // ensure each rule has a priority value
    let nextPriority = model.reduce(
      (p: number, cf: any) => Math.max(p, ...cf.rules.map((rule: any) => rule.priority || 0)),
      1
    );
    model.forEach((cf: any) => {
      cf.rules.forEach((rule: any) => {
        if (!rule.priority) {
          rule.priority = nextPriority++;
        }

        if (rule.style) {
          rule.dxfId = options.styles.addDxfStyle(rule.style);
        }
      });
    });
  }

  render(xmlStream: any, model: any) {
    model.forEach((cf: any) => {
      this.cfXform.render(xmlStream, cf);
    });
  }

  parseOpen(node: any) {
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

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
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

  reconcile(model: any, options: any) {
    model.forEach((cf: any) => {
      cf.rules.forEach((rule: any) => {
        if (rule.dxfId !== undefined) {
          rule.style = options.styles.getDxfStyle(rule.dxfId);
          delete rule.dxfId;
        }
      });
    });
  }
}

export default ConditionalFormattingsXform;
