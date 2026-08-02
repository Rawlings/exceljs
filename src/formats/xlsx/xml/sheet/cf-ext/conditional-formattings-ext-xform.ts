import CompositeXform from '../../composite-xform';

import CfRuleExtXform from './cf-rule-ext-xform';
import ConditionalFormattingExtXform, {
  type ConditionalFormattingExtModel,
} from './conditional-formatting-ext-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';

type ConditionalFormattingsExtModel = ConditionalFormattingExtModel[] & {
  hasExtContent?: boolean;
};

class ConditionalFormattingsExtXform extends CompositeXform {
  cfXform: ConditionalFormattingExtXform;

  constructor() {
    super();

    this.map = {
      'x14:conditionalFormatting': (this.cfXform = new ConditionalFormattingExtXform()),
    };
  }

  override get tag() {
    return 'x14:conditionalFormattings';
  }

  hasContent(model: ConditionalFormattingsExtModel) {
    if (model.hasExtContent === undefined) {
      model.hasExtContent = model.some((cf) => cf.rules.some(CfRuleExtXform.isExt));
    }
    return model.hasExtContent;
  }

  override prepare(model: ConditionalFormattingsExtModel, options: any) {
    model.forEach((cf) => {
      this.cfXform.prepare(cf, options);
    });
  }

  override render(xmlStream: XmlStream, model: ConditionalFormattingsExtModel) {
    if (this.hasContent(model)) {
      xmlStream.openNode(this.tag as string);
      model.forEach((cf) => this.cfXform.render(xmlStream, cf));
      xmlStream.closeNode();
    }
  }

  override createNewModel(): ConditionalFormattingsExtModel {
    return [];
  }

  override onParserClose(_name: string, parser: { model: any }) {
    // model is array of conditional formatting objects
    (this.model as ConditionalFormattingsExtModel).push(parser.model);
  }
}

export default ConditionalFormattingsExtXform;
