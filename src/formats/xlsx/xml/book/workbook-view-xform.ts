import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface WorkbookViewModel {
  visibility?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  activeTab?: number;
  firstSheet?: number;
}

class WorkbookViewXform extends BaseXform {
  override render(xmlStream: XmlStream, model: WorkbookViewModel) {
    const attributes: Record<string, unknown> = {};
    if (model.visibility && model.visibility !== 'visible') {
      attributes.visibility = model.visibility;
    }
    attributes.xWindow = model.x || 0;
    attributes.yWindow = model.y || 0;
    attributes.windowWidth = model.width || 12000;
    attributes.windowHeight = model.height || 24000;
    if (model.activeTab !== undefined) {
      attributes.activeTab = model.activeTab;
    }
    if (model.firstSheet !== undefined) {
      attributes.firstSheet = model.firstSheet;
    }
    xmlStream.leafNode('workbookView', attributes);
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'workbookView') {
      const attrs = node.attributes as Record<string, string>;
      const model = (this.model = {} as Record<string, unknown>);
      const addS = function (name: string, value: string | undefined, dflt: string | undefined) {
        const s = value !== undefined ? (model[name] = value) : dflt;
        if (s !== undefined) {
          model[name] = s;
        }
      };
      const addN = function (name: string, value: string | undefined, dflt: number | undefined) {
        const n = value !== undefined ? (model[name] = parseInt(value, 10)) : dflt;
        if (n !== undefined) {
          model[name] = n;
        }
      };
      addN('x', attrs.xWindow, 0);
      addN('y', attrs.yWindow, 0);
      addN('width', attrs.windowWidth, 25000);
      addN('height', attrs.windowHeight, 10000);
      addS('visibility', attrs.visibility, 'visible');
      addN('activeTab', attrs.activeTab, undefined);
      addN('firstSheet', attrs.firstSheet, undefined);
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default WorkbookViewXform;
