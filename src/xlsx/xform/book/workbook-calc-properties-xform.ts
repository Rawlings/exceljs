import BaseXform from '#src/xlsx/xform/base-xform';

class WorkbookCalcPropertiesXform extends BaseXform {
  render(xmlStream: any, model: any) {
    xmlStream.leafNode('calcPr', {
      calcId: 171027,
      fullCalcOnLoad: model.fullCalcOnLoad ? 1 : undefined,
    });
  }

  parseOpen(node: any) {
    if (node.name === 'calcPr') {
      this.model = {};
      if (node.attributes.fullCalcOnLoad) {
        this.model.fullCalcOnLoad = true;
      }
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default WorkbookCalcPropertiesXform;
