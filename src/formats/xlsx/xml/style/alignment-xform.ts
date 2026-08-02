import Enums from '../../../../core/enums';

import utils from '../../../../utils/helpers/utils';
import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface AlignmentModel {
  horizontal?: string;
  vertical?: string;
  wrapText?: boolean;
  shrinkToFit?: boolean;
  indent?: number;
  textRotation?: number | 'vertical';
  readingOrder?: 'ltr' | 'rtl';
}

const horizontalValues = [
  'left',
  'center',
  'right',
  'fill',
  'centerContinuous',
  'distributed',
  'justify',
].reduce(
  (p: Record<string, boolean>, v) => {
    p[v] = true;
    return p;
  },
  {} as Record<string, boolean>
);

const verticalValues = ['top', 'middle', 'bottom', 'distributed', 'justify'].reduce(
  (p: Record<string, boolean>, v) => {
    p[v] = true;
    return p;
  },
  {} as Record<string, boolean>
);

const validation = {
  horizontal(value: string | undefined) {
    return value && horizontalValues[value] ? value : undefined;
  },

  vertical(value: string | undefined) {
    if (value === 'middle') return 'center';
    return value && verticalValues[value] ? value : undefined;
  },
  wrapText(value: unknown) {
    return value ? true : undefined;
  },
  shrinkToFit(value: unknown) {
    return value ? true : undefined;
  },
  textRotation(value: unknown): number | 'vertical' | undefined {
    switch (value) {
      case 'vertical':
        return value;
      default: {
        const v = utils.validInt(value);
        return v >= -90 && v <= 90 ? v : undefined;
      }
    }
  },
  indent(value: unknown) {
    const v = utils.validInt(value);
    return Math.max(0, v);
  },
  readingOrder(value: string | undefined) {
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
  toXml(textRotationInput: unknown): number | undefined {
    const textRotation = validation.textRotation(textRotationInput);
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
  toModel(textRotation: unknown): number | 'vertical' | undefined {
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
  override get tag() {
    return 'alignment';
  }

  override render(xmlStream: XmlStream, model: AlignmentModel) {
    xmlStream.addRollback();
    xmlStream.openNode('alignment');

    let isValid = false;
    function add(name: string, value: unknown) {
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

  override parseOpen(node: SaxNode) {
    const attrs = node.attributes as Record<string, string>;
    const model: AlignmentModel = {};

    let valid = false;
    function add<K extends keyof AlignmentModel>(
      truthy: unknown,
      name: K,
      value: AlignmentModel[K]
    ) {
      if (truthy) {
        model[name] = value;
        valid = true;
      }
    }
    add(attrs.horizontal, 'horizontal', attrs.horizontal);
    add(attrs.vertical, 'vertical', attrs.vertical === 'center' ? 'middle' : attrs.vertical);
    add(attrs.wrapText, 'wrapText', utils.parseBoolean(attrs.wrapText));
    add(attrs.shrinkToFit, 'shrinkToFit', utils.parseBoolean(attrs.shrinkToFit));
    add(attrs.indent, 'indent', parseInt(attrs.indent, 10));
    add(attrs.textRotation, 'textRotation', textRotationXform.toModel(attrs.textRotation));
    add(attrs.readingOrder, 'readingOrder', attrs.readingOrder === '2' ? 'rtl' : 'ltr');

    this.model = valid ? model : null;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default AlignmentXform;
