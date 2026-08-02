import BaseXform from '#src/xlsx/xform/base-xform';
import CompositeXform from '#src/xlsx/xform/composite-xform';

import ColorXform from '#src/xlsx/xform/style/color-xform';
import CfvoExtXform from '#src/xlsx/xform/sheet/cf-ext/cfvo-ext-xform';

class DatabarExtXform extends CompositeXform {
  cfvoXform: any;
  borderColorXform: any;
  negativeBorderColorXform: any;
  negativeFillColorXform: any;
  axisColorXform: any;

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

  static isExt(rule: any) {
    // not all databars need ext
    // TODO: refine this
    return !rule.gradient;
  }

  get tag() {
    return 'x14:dataBar';
  }

  render(xmlStream: any, model: any) {
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

    model.cfvo.forEach((cfvo: any) => {
      this.cfvoXform.render(xmlStream, cfvo);
    });

    this.borderColorXform.render(xmlStream, model.borderColor);
    this.negativeBorderColorXform.render(xmlStream, model.negativeBorderColor);
    this.negativeFillColorXform.render(xmlStream, model.negativeFillColor);
    this.axisColorXform.render(xmlStream, model.axisColor);

    xmlStream.closeNode();
  }

  createNewModel({ attributes }: any) {
    return {
      cfvo: [],
      minLength: BaseXform.toIntValue(attributes.minLength, 0),
      maxLength: BaseXform.toIntValue(attributes.maxLength, 100),
      border: BaseXform.toBoolValue(attributes.border, false),
      gradient: BaseXform.toBoolValue(attributes.gradient, true),
      negativeBarColorSameAsPositive: BaseXform.toBoolValue(
        attributes.negativeBarColorSameAsPositive,
        true
      ),
      negativeBarBorderColorSameAsPositive: BaseXform.toBoolValue(
        attributes.negativeBarBorderColorSameAsPositive,
        true
      ),
      axisPosition: BaseXform.toStringValue(attributes.axisPosition, 'auto'),
      direction: BaseXform.toStringValue(attributes.direction, 'leftToRight'),
    };
  }

  onParserClose(name: any, parser: any) {
    const [, prop] = name.split(':');
    switch (prop) {
      case 'cfvo':
        this.model.cfvo.push(parser.model);
        break;

      default:
        this.model[prop] = parser.model;
        break;
    }
  }
}

export default DatabarExtXform;
