import utils from '#src/utils/helpers/utils';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface ColModel {
  min: number;
  max: number;
  width?: number;
  styleId?: number;
  hidden?: boolean;
  bestFit?: boolean;
  outlineLevel?: number;
  collapsed?: boolean;
  style?: Record<string, unknown>;
}

interface StyleManagerLike {
  addStyleModel(style: Record<string, unknown>): number;
  getStyleModel(id: number): Record<string, unknown>;
}

class ColXform extends BaseXform {
  override get tag() {
    return 'col';
  }

  override prepare(model: ColModel, options: { styles: StyleManagerLike }) {
    const styleId = options.styles.addStyleModel(model.style || {});
    if (styleId) {
      model.styleId = styleId;
    }
  }

  override render(xmlStream: XmlStream, model: ColModel) {
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
    xmlStream.addAttribute('customWidth', '1');
    if (model.outlineLevel) {
      xmlStream.addAttribute('outlineLevel', model.outlineLevel);
    }
    if (model.collapsed) {
      xmlStream.addAttribute('collapsed', '1');
    }
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'col') {
      const attrs = node.attributes as Record<string, string>;
      const model: ColModel = (this.model = {
        min: parseInt(attrs.min || '0', 10),
        max: parseInt(attrs.max || '0', 10),
        width: attrs.width === undefined ? undefined : parseFloat(attrs.width || '0'),
      });
      if (attrs.style) {
        model.styleId = parseInt(attrs.style, 10);
      }
      if (utils.parseBoolean(attrs.hidden)) {
        model.hidden = true;
      }
      if (utils.parseBoolean(attrs.bestFit)) {
        model.bestFit = true;
      }
      if (attrs.outlineLevel) {
        model.outlineLevel = parseInt(attrs.outlineLevel, 10);
      }
      if (utils.parseBoolean(attrs.collapsed)) {
        model.collapsed = true;
      }
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }

  override reconcile(model: ColModel, options: { styles: StyleManagerLike }) {
    // reconcile column styles
    if (model.styleId) {
      model.style = options.styles.getStyleModel(model.styleId);
    }
  }
}

export default ColXform;
