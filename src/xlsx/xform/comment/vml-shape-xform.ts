import BaseXform from '#src/xlsx/xform/base-xform';
import VmlTextboxXform from '#src/xlsx/xform/comment/vml-textbox-xform';
import VmlClientDataXform from '#src/xlsx/xform/comment/vml-client-data-xform';

class VmlShapeXform extends BaseXform {
  static V_SHAPE_ATTRIBUTES: any;
  constructor() {
    super();
    this.map = {
      'v:textbox': new VmlTextboxXform(),
      'x:ClientData': new VmlClientDataXform(),
    };
  }

  get tag() {
    return 'v:shape';
  }

  render(xmlStream: any, model: any, index: any) {
    xmlStream.openNode('v:shape', VmlShapeXform.V_SHAPE_ATTRIBUTES(model, index));

    xmlStream.leafNode('v:fill', { color2: 'infoBackground [80]' });
    xmlStream.leafNode('v:shadow', { color: 'none [81]', obscured: 't' });
    xmlStream.leafNode('v:path', { 'o:connecttype': 'none' });
    this.map['v:textbox'].render(xmlStream, model);
    this.map['x:ClientData'].render(xmlStream, model);

    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case this.tag:
        this.reset();
        this.model = {
          margins: {
            insetmode: node.attributes['o:insetmode'],
          },
          anchor: '',
          editAs: '',
          protection: {},
        };
        break;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model.margins.inset = this.map['v:textbox'].model && this.map['v:textbox'].model.inset;
        this.model.protection =
          this.map['x:ClientData'].model && this.map['x:ClientData'].model.protection;
        this.model.anchor = this.map['x:ClientData'].model && this.map['x:ClientData'].model.anchor;
        this.model.editAs = this.map['x:ClientData'].model && this.map['x:ClientData'].model.editAs;
        return false;
      default:
        return true;
    }
  }
}

VmlShapeXform.V_SHAPE_ATTRIBUTES = (model: any, index: any) => ({
  id: `_x0000_s${1025 + index}`,
  type: '#_x0000_t202',
  style:
    'position:absolute; margin-left:105.3pt;margin-top:10.5pt;width:97.8pt;height:59.1pt;z-index:1;visibility:hidden',
  fillcolor: 'infoBackground [80]',
  strokecolor: 'none [81]',
  'o:insetmode': model.note.margins && model.note.margins.insetmode,
});

export default VmlShapeXform;
