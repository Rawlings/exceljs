import CompositeXform from '#src/formats/xlsx/xml/composite-xform';

import SqRefExtXform from '#src/formats/xlsx/xml/sheet/cf-ext/sqref-ext-xform';
import CfRuleExtXform from '#src/formats/xlsx/xml/sheet/cf-ext/cf-rule-ext-xform';

class ConditionalFormattingExtXform extends CompositeXform {
  sqRef: any;
  cfRule: any;

  constructor() {
    super();

    this.map = {
      'xm:sqref': (this.sqRef = new SqRefExtXform()),
      'x14:cfRule': (this.cfRule = new CfRuleExtXform()),
    };
  }

  get tag() {
    return 'x14:conditionalFormatting';
  }

  prepare(model: any, options: any) {
    model.rules.forEach((rule: any) => {
      this.cfRule.prepare(rule, options);
    });
  }

  render(xmlStream: any, model: any) {
    if (!model.rules.some(CfRuleExtXform.isExt)) {
      return;
    }

    xmlStream.openNode(this.tag, {
      'xmlns:xm': 'http://schemas.microsoft.com/office/excel/2006/main',
    });

    model.rules
      .filter(CfRuleExtXform.isExt)
      .forEach((rule: any) => this.cfRule.render(xmlStream, rule));

    // for some odd reason, Excel needs the <xm:sqref> node to be after the rules
    this.sqRef.render(xmlStream, model.ref);

    xmlStream.closeNode();
  }

  createNewModel() {
    return {
      rules: [],
    };
  }

  onParserClose(name: any, parser: any) {
    switch (name) {
      case 'xm:sqref':
        this.model.ref = parser.model;
        break;

      case 'x14:cfRule':
        this.model.rules.push(parser.model);
        break;
    }
  }
}

export default ConditionalFormattingExtXform;
