import Enums from '#src/core/enums';

import utils from '#src/utils/helpers/utils';
import BaseXform from '#src/formats/xlsx/xml/base-xform';

const validation: any = {
  horizontalValues: [
    'left',
    'center',
    'right',
    'fill',
    'centerContinuous',
    'distributed',
    'justify',
  ].reduce((p: any, v: any) => {
    p[v] = true;
    return p;
  }, {}),
  horizontal(value: any) {
    return this.horizontalValues[value] ? value : undefined;
  },

  verticalValues: ['top', 'middle', 'bottom', 'distributed', 'justify'].reduce((p: any, v: any) => {
    p[v] = true;
    return p;
  }, {}),
  vertical(value: any) {
    if (value === 'middle') return 'center';
    return this.verticalValues[value] ? value : undefined;
  },
  wrapText(value: any) {
    return value ? true : undefined;
  },
  shrinkToFit(value: any) {
    return value ? true : undefined;
  },
  textRotation(value: any) {
    switch (value) {
      case 'vertical':
        return value;
      default:
        value = utils.validInt(value);
        return value >= -90 && value <= 90 ? value : undefined;
    }
  },
  indent(value: any) {
    value = utils.validInt(value);
    return Math.max(0, value);
  },
  readingOrder(value: any) {
    switch (value) {
      case 'ltr':
        return Enums.ReadingOrder.LeftToRight;
      case 'rtl':
        return Enums.ReadingOrder.RightToLeft;
      default:
        return undefined;
    }
  },
};

const textRotationXform = {
  toXml(textRotation: any) {
    textRotation = validation.textRotation(textRotation);
    if (textRotation) {
      if (textRotation === 'vertical') {
        return 255;
      }

      const tr = Math.round(textRotation);
      if (tr >= 0 && tr <= 90) {
        return tr;
      }

      if (tr < 0 && tr >= -90) {
        return 90 - tr;
      }
    }
    return undefined;
  },
  toModel(textRotation: any) {
    const tr = utils.validInt(textRotation);
    if (tr !== undefined) {
      if (tr === 255) {
        return 'vertical';
      }
      if (tr >= 0 && tr <= 90) {
        return tr;
      }
      if (tr > 90 && tr <= 180) {
        return 90 - tr;
      }
    }
    return undefined;
  },
};

// Alignment encapsulates translation from style.alignment model to/from xlsx
class AlignmentXform extends BaseXform {
  get tag() {
    return 'alignment';
  }

  render(xmlStream: any, model: any) {
    xmlStream.addRollback();
    xmlStream.openNode('alignment');

    let isValid = false;
    function add(name: any, value: any) {
      if (value) {
        xmlStream.addAttribute(name, value);
        isValid = true;
      }
    }
    add('horizontal', validation.horizontal(model.horizontal));
    add('vertical', validation.vertical(model.vertical));
    add('wrapText', validation.wrapText(model.wrapText) ? '1' : false);
    add('shrinkToFit', validation.shrinkToFit(model.shrinkToFit) ? '1' : false);
    add('indent', validation.indent(model.indent));
    add('textRotation', textRotationXform.toXml(model.textRotation));
    add('readingOrder', validation.readingOrder(model.readingOrder));

    xmlStream.closeNode();

    if (isValid) {
      xmlStream.commit();
    } else {
      xmlStream.rollback();
    }
  }

  parseOpen(node: any) {
    const model: any = {};

    let valid = false;
    function add(truthy: any, name: any, value: any) {
      if (truthy) {
        model[name] = value;
        valid = true;
      }
    }
    add(node.attributes.horizontal, 'horizontal', node.attributes.horizontal);
    add(
      node.attributes.vertical,
      'vertical',
      node.attributes.vertical === 'center' ? 'middle' : node.attributes.vertical
    );
    add(node.attributes.wrapText, 'wrapText', utils.parseBoolean(node.attributes.wrapText));
    add(
      node.attributes.shrinkToFit,
      'shrinkToFit',
      utils.parseBoolean(node.attributes.shrinkToFit)
    );
    add(node.attributes.indent, 'indent', parseInt(node.attributes.indent, 10));
    add(
      node.attributes.textRotation,
      'textRotation',
      textRotationXform.toModel(node.attributes.textRotation)
    );
    add(
      node.attributes.readingOrder,
      'readingOrder',
      node.attributes.readingOrder === '2' ? 'rtl' : 'ltr'
    );

    this.model = valid ? model : null;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default AlignmentXform;
