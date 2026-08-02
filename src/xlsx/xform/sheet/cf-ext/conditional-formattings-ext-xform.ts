import CompositeXform from '#src/xlsx/xform/composite-xform';

import CfRuleExtXform from '#src/xlsx/xform/sheet/cf-ext/cf-rule-ext-xform';
import ConditionalFormattingExtXform from '#src/xlsx/xform/sheet/cf-ext/conditional-formatting-ext-xform';

class ConditionalFormattingsExtXform extends CompositeXform {
  cfXform: any;

  constructor() {
    super();

    this.map = {
      'x14:conditionalFormatting': (this.cfXform = new ConditionalFormattingExtXform()),
    };
  }

  get tag() {
    return 'x14:conditionalFormattings';
  }

  hasContent(model: any) {
    if (model.hasExtContent === undefined) {
      model.hasExtContent = model.some((cf: any) => cf.rules.some(CfRuleExtXform.isExt));
    }
    return model.hasExtContent;
  }

  prepare(model: any, options: any) {
    model.forEach((cf: any) => {
      this.cfXform.prepare(cf, options);
    });
  }

  render(xmlStream: any, model: any) {
    if (this.hasContent(model)) {
      xmlStream.openNode(this.tag);
      model.forEach((cf: any) => this.cfXform.render(xmlStream, cf));
      xmlStream.closeNode();
    }
  }

  createNewModel() {
    return [];
  }

  onParserClose(name: any, parser: any) {
    // model is array of conditional formatting objects
    this.model.push(parser.model);
  }
}

export default ConditionalFormattingsExtXform;
