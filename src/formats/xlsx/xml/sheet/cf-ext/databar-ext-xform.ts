import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';

import ColorXform, { type ColorModel } from '../../style/color-xform';
import CfvoExtXform, { type CfvoExtModel } from './cfvo-ext-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface DatabarExtModel {
  cfvo: CfvoExtModel[];
  minLength?: number;
  maxLength?: number;
  border?: boolean;
  gradient?: boolean;
  negativeBarColorSameAsPositive?: boolean;
  negativeBarBorderColorSameAsPositive?: boolean;
  axisPosition?: string;
  direction?: string;
  borderColor?: ColorModel;
  negativeBorderColor?: ColorModel;
  negativeFillColor?: ColorModel;
  axisColor?: ColorModel;
}

class DatabarExtXform extends CompositeXform {
  cfvoXform: CfvoExtXform;
  borderColorXform: ColorXform;
  negativeBorderColorXform: ColorXform;
  negativeFillColorXform: ColorXform;
  axisColorXform: ColorXform;

  constructor() {
    super();

    this.map = {
      'x14:cfvo': (this.cfvoXform = new CfvoExtXform()),
      'x14:borderColor': (this.borderColorXform = new ColorXform('x14:borderColor')),
      'x14:negativeBorderColor': (this.negativeBorderColorXform = new ColorXform(
        'x14:negativeBorderColor'
      )),
      'x14:negativeFillColor': (this.negativeFillColorXform = new ColorXform(
        'x14:negativeFillColor'
      )),
      'x14:axisColor': (this.axisColorXform = new ColorXform('x14:axisColor')),
    };
  }

  static isExt(rule: { gradient?: boolean }) {
    // not all databars need ext
    // TODO: refine this
    return !rule.gradient;
  }

  override get tag() {
    return 'x14:dataBar';
  }

  override render(xmlStream: XmlStream, model: DatabarExtModel) {
    xmlStream.openNode(this.tag, {
      minLength: BaseXform.toIntAttribute(model.minLength, 0, true),
      maxLength: BaseXform.toIntAttribute(model.maxLength, 100, true),
      gradient: BaseXform.toBoolAttribute(model.gradient, true),
      border: BaseXform.toBoolAttribute(model.border, false),
      negativeBarColorSameAsPositive: BaseXform.toBoolAttribute(
        model.negativeBarColorSameAsPositive,
        true
      ),
      negativeBarBorderColorSameAsPositive: BaseXform.toBoolAttribute(
        model.negativeBarBorderColorSameAsPositive,
        true
      ),
      axisPosition: BaseXform.toAttribute(model.axisPosition, 'auto'),
      direction: BaseXform.toAttribute(model.direction, 'leftToRight'),
    });

    model.cfvo.forEach((cfvo) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    this.borderColorXform.render(xmlStream, model.borderColor);
    this.negativeBorderColorXform.render(xmlStream, model.negativeBorderColor);
    this.negativeFillColorXform.render(xmlStream, model.negativeFillColor);
    this.axisColorXform.render(xmlStream, model.axisColor);

    xmlStream.closeNode();
  }

  override createNewModel({ attributes }: SaxNode): DatabarExtModel {
    const attrs = attributes as Record<string, string>;
    return {
      cfvo: [],
      minLength: BaseXform.toIntValue(attrs.minLength, 0),
      maxLength: BaseXform.toIntValue(attrs.maxLength, 100),
      border: BaseXform.toBoolValue(attrs.border, false),
      gradient: BaseXform.toBoolValue(attrs.gradient, true),
      negativeBarColorSameAsPositive: BaseXform.toBoolValue(
        attrs.negativeBarColorSameAsPositive,
        true
      ),
      negativeBarBorderColorSameAsPositive: BaseXform.toBoolValue(
        attrs.negativeBarBorderColorSameAsPositive,
        true
      ),
      axisPosition: BaseXform.toStringValue(attrs.axisPosition, 'auto') as string,
      direction: BaseXform.toStringValue(attrs.direction, 'leftToRight') as string,
    };
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    const [, prop] = name.split(':');
    const model = this.model;
    switch (prop) {
      case 'cfvo':
        model.cfvo.push(parser.model as CfvoExtModel);
        break;

      default:
        model[prop] = parser.model;
        break;
    }
  }
}

export default DatabarExtXform;
