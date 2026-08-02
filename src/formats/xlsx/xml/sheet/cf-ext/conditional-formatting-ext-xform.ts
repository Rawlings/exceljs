import CompositeXform from '../../composite-xform';

import SqRefExtXform from './sqref-ext-xform';
import CfRuleExtXform, { type CfRuleExtModel } from './cf-rule-ext-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';

export interface ConditionalFormattingExtModel {
  ref?: string;
  rules: CfRuleExtModel[];
}

class ConditionalFormattingExtXform extends CompositeXform {
  sqRef: SqRefExtXform;
  cfRule: CfRuleExtXform;

  constructor() {
    super();

    this.map = {
      'xm:sqref': (this.sqRef = new SqRefExtXform()),
      'x14:cfRule': (this.cfRule = new CfRuleExtXform()),
    };
  }

  override get tag() {
    return 'x14:conditionalFormatting';
  }

  override prepare(model: ConditionalFormattingExtModel, options: unknown) {
    model.rules.forEach((rule) => {
      this.cfRule.prepare(rule, options);
    });
  }

  override render(xmlStream: XmlStream, model: ConditionalFormattingExtModel) {
    if (!model.rules.some(CfRuleExtXform.isExt)) {
      return;
    }

    xmlStream.openNode(this.tag, {
      'xmlns:xm': 'http://schemas.microsoft.com/office/excel/2006/main',
    });

    model.rules.filter(CfRuleExtXform.isExt).forEach((rule) => this.cfRule.render(xmlStream, rule));

    // for some odd reason, Excel needs the <xm:sqref> node to be after the rules
    this.sqRef.render(xmlStream, model.ref as string);

    xmlStream.closeNode();
  }

  override createNewModel(): ConditionalFormattingExtModel {
    return {
      rules: [],
    };
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    const model = this.model;
    switch (name) {
      case 'xm:sqref':
        model.ref = parser.model as string;
        break;

      case 'x14:cfRule':
        model.rules.push(parser.model as CfRuleExtModel);
        break;
    }
  }
}

export default ConditionalFormattingExtXform;
