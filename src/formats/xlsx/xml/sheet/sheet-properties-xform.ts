import BaseXform from '#src/formats/xlsx/xml/base-xform';
import ColorXform from '#src/formats/xlsx/xml/style/color-xform';
import PageSetupPropertiesXform from '#src/formats/xlsx/xml/sheet/page-setup-properties-xform';
import OutlinePropertiesXform from '#src/formats/xlsx/xml/sheet/outline-properties-xform';

class SheetPropertiesXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      tabColor: new ColorXform('tabColor'),
      pageSetUpPr: new PageSetupPropertiesXform(),
      outlinePr: new OutlinePropertiesXform(),
    };
  }

  get tag() {
    return 'sheetPr';
  }

  render(xmlStream: any, model: any) {
    if (model) {
      xmlStream.addRollback();
      xmlStream.openNode('sheetPr');

      let inner = false;
      inner = this.map.tabColor.render(xmlStream, model.tabColor) || inner;
      inner = this.map.pageSetUpPr.render(xmlStream, model.pageSetup) || inner;
      inner = this.map.outlinePr.render(xmlStream, model.outlineProperties) || inner;

      if (inner) {
        xmlStream.closeNode();
        xmlStream.commit();
      } else {
        xmlStream.rollback();
      }
    }
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    if (node.name === this.tag) {
      this.reset();
      return true;
    }
    if (this.map[node.name]) {
      this.parser = this.map[node.name];
      this.parser.parseOpen(node);
      return true;
    }
    return false;
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
      return true;
    }
    return false;
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    if (this.map.tabColor.model || this.map.pageSetUpPr.model || this.map.outlinePr.model) {
      this.model = {};
      if (this.map.tabColor.model) {
        this.model.tabColor = this.map.tabColor.model;
      }
      if (this.map.pageSetUpPr.model) {
        this.model.pageSetup = this.map.pageSetUpPr.model;
      }
      if (this.map.outlinePr.model) {
        this.model.outlineProperties = this.map.outlinePr.model;
      }
    } else {
      this.model = null;
    }
    return false;
  }
}

export default SheetPropertiesXform;
