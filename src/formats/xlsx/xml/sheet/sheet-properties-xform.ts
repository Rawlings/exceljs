import BaseXform from '#src/formats/xlsx/xml/base-xform';
import ColorXform from '#src/formats/xlsx/xml/style/color-xform';
import type { ColorModel } from '#src/formats/xlsx/xml/style/color-xform';
import PageSetupPropertiesXform from '#src/formats/xlsx/xml/sheet/page-setup-properties-xform';
import type { PageSetupPropertiesModel } from '#src/formats/xlsx/xml/sheet/page-setup-properties-xform';
import OutlinePropertiesXform from '#src/formats/xlsx/xml/sheet/outline-properties-xform';
import type { OutlinePropertiesModel } from '#src/formats/xlsx/xml/sheet/outline-properties-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface SheetPropertiesModel {
  tabColor?: ColorModel;
  pageSetup?: PageSetupPropertiesModel;
  outlineProperties?: OutlinePropertiesModel;
}

class SheetPropertiesXform extends BaseXform {
  override map: {
    tabColor: ColorXform;
    pageSetUpPr: PageSetupPropertiesXform;
    outlinePr: OutlinePropertiesXform;
  };

  constructor() {
    super();

    this.map = {
      tabColor: new ColorXform('tabColor'),
      pageSetUpPr: new PageSetupPropertiesXform(),
      outlinePr: new OutlinePropertiesXform(),
    };
  }

  override get tag() {
    return 'sheetPr';
  }

  override render(xmlStream: XmlStream, model: SheetPropertiesModel | undefined) {
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

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    if (node.name === this.tag) {
      this.reset();
      return true;
    }
    if (this.map[node.name as keyof SheetPropertiesXform['map']]) {
      this.parser = this.map[node.name as keyof SheetPropertiesXform['map']];
      this.parser.parseOpen(node);
      return true;
    }
    return false;
  }

  override parseText(text: string): boolean {
    if (this.parser) {
      this.parser.parseText(text);
      return true;
    }
    return false;
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    if (this.map.tabColor.model || this.map.pageSetUpPr.model || this.map.outlinePr.model) {
      const model: SheetPropertiesModel = {};
      if (this.map.tabColor.model) {
        model.tabColor = this.map.tabColor.model;
      }
      if (this.map.pageSetUpPr.model) {
        model.pageSetup = this.map.pageSetUpPr.model;
      }
      if (this.map.outlinePr.model) {
        model.outlineProperties = this.map.outlinePr.model;
      }
      this.model = model;
    } else {
      this.model = null;
    }
    return false;
  }
}

export default SheetPropertiesXform;
