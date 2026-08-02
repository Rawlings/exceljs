import BaseXform from '#src/formats/xlsx/xml/base-xform';

class WorkbookViewXform extends BaseXform {
  render(xmlStream: any, model: any) {
    const attributes: Record<string, any> = {};
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

  parseOpen(node: any) {
    if (node.name === 'workbookView') {
      const model = (this.model = {} as Record<string, any>);
      const addS = function (name: any, value: any, dflt: any) {
        const s = value !== undefined ? (model[name] = value) : dflt;
        if (s !== undefined) {
          model[name] = s;
        }
      };
      const addN = function (name: any, value: any, dflt: any) {
        const n = value !== undefined ? (model[name] = parseInt(value, 10)) : dflt;
        if (n !== undefined) {
          model[name] = n;
        }
      };
      addN('x', node.attributes.xWindow, 0);
      addN('y', node.attributes.yWindow, 0);
      addN('width', node.attributes.windowWidth, 25000);
      addN('height', node.attributes.windowHeight, 10000);
      addS('visibility', node.attributes.visibility, 'visible');
      addN('activeTab', node.attributes.activeTab, undefined);
      addN('firstSheet', node.attributes.firstSheet, undefined);
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default WorkbookViewXform;
