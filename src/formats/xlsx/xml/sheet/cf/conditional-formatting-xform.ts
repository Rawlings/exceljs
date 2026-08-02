import CompositeXform from '../../composite-xform';

import CfRuleXform, { type CfRuleModel } from './cf-rule-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface ConditionalFormattingModel {
  ref?: string;
  rules: CfRuleModel[];
}

class ConditionalFormattingXform extends CompositeXform {
  constructor() {
    super();

    this.map = {
      cfRule: new CfRuleXform(),
    };
  }

  override get tag() {
    return 'conditionalFormatting';
  }

  override render(xmlStream: XmlStream, model: ConditionalFormattingModel) {
    // if there are no primitive rules, exit now
    if (!model.rules.some(CfRuleXform.isPrimitive)) {
      return;
    }

    xmlStream.openNode(this.tag as string, { sqref: model.ref });

    model.rules.forEach((rule) => {
      if (CfRuleXform.isPrimitive(rule)) {
        rule.ref = model.ref;
        this.map.cfRule.render(xmlStream, rule);
      }
    });

    xmlStream.closeNode();
  }

  override createNewModel({ attributes }: SaxNode): ConditionalFormattingModel {
    const attrs = attributes as Record<string, string>;
    return {
      ref: attrs.sqref,
      rules: [],
    };
  }

  override onParserClose(_name: string, parser: { model: any }) {
    (this.model as ConditionalFormattingModel).rules.push(parser.model);
  }
}

export default ConditionalFormattingXform;
