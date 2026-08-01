import utils from '../../../utils/utils';
import BaseXform from '../base-xform';

class ColXform extends BaseXform {
  get tag() {
    return 'col';
  }

  prepare(model: any, options: any) {
    const styleId = options.styles.addStyleModel(model.style || {});
    if (styleId) {
      model.styleId = styleId;
    }
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode('col');
    xmlStream.addAttribute('min', model.min);
    xmlStream.addAttribute('max', model.max);
    if (model.width) {
      xmlStream.addAttribute('width', model.width);
    }
    if (model.styleId) {
      xmlStream.addAttribute('style', model.styleId);
    }
    if (model.hidden) {
      xmlStream.addAttribute('hidden', '1');
    }
    if (model.bestFit) {
      xmlStream.addAttribute('bestFit', '1');
    }
    if (model.outlineLevel) {
      xmlStream.addAttribute('outlineLevel', model.outlineLevel);
    }
    if (model.collapsed) {
      xmlStream.addAttribute('collapsed', '1');
    }
    xmlStream.addAttribute('customWidth', '1');
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (node.name === 'col') {
      const model: any = (this.model = {
        min: parseInt(node.attributes.min || '0', 10),
        max: parseInt(node.attributes.max || '0', 10),
        width:
          node.attributes.width === undefined
            ? undefined
            : parseFloat(node.attributes.width || '0'),
      });
      if (node.attributes.style) {
        model.styleId = parseInt(node.attributes.style, 10);
      }
      if (utils.parseBoolean(node.attributes.hidden)) {
        model.hidden = true;
      }
      if (utils.parseBoolean(node.attributes.bestFit)) {
        model.bestFit = true;
      }
      if (node.attributes.outlineLevel) {
        model.outlineLevel = parseInt(node.attributes.outlineLevel, 10);
      }
      if (utils.parseBoolean(node.attributes.collapsed)) {
        model.collapsed = true;
      }
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }

  reconcile(model: any, options: any) {
    // reconcile column styles
    if (model.styleId) {
      model.style = options.styles.getStyleModel(model.styleId);
    }
  }
}

export default ColXform;
