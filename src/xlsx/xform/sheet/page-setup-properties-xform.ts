import BaseXform from '#src/xlsx/xform/base-xform';

class PageSetupPropertiesXform extends BaseXform {
  get tag() {
    return 'pageSetUpPr';
  }

  render(xmlStream: any, model: any) {
    if (model && model.fitToPage) {
      xmlStream.leafNode(this.tag, {
        fitToPage: model.fitToPage ? '1' : undefined,
      });
      return true;
    }
    return false;
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      this.model = {
        fitToPage: node.attributes.fitToPage === '1',
      };
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default PageSetupPropertiesXform;
