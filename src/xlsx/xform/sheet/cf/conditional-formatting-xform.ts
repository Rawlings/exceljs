import CompositeXform from '#src/xlsx/xform/composite-xform';

import CfRuleXform from '#src/xlsx/xform/sheet/cf/cf-rule-xform';

class ConditionalFormattingXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      cfRule: new CfRuleXform(),
    };
  }

  get tag() {
    return 'conditionalFormatting';
  }

  render(xmlStream: any, model: any) {
    // if there are no primitive rules, exit now
    if (!model.rules.some(CfRuleXform.isPrimitive)) {
      return;
    }

    xmlStream.openNode(this.tag, { sqref: model.ref });

    model.rules.forEach((rule: any) => {
      if (CfRuleXform.isPrimitive(rule)) {
        rule.ref = model.ref;
        this.map.cfRule.render(xmlStream, rule);
      }
    });

    xmlStream.closeNode();
  }

  createNewModel({ attributes }: any) {
    return {
      ref: attributes.sqref,
      rules: [],
    };
  }

  onParserClose(name: any, parser: any) {
    this.model.rules.push(parser.model);
  }
}

export default ConditionalFormattingXform;
