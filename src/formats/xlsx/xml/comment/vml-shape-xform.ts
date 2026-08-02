import BaseXform from '../base-xform';
import VmlTextboxXform from './vml-textbox-xform';
import VmlClientDataXform from './vml-client-data-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface VmlShapeModel {
  note?: {
    margins?: { insetmode?: unknown; inset?: number[] | string };
    protection?: { locked?: unknown; lockText?: unknown };
    editAs?: string;
  };
  margins: { insetmode?: unknown; inset?: unknown };
  anchor: unknown;
  editAs: string;
  protection: Record<string, unknown>;
  // set on the comment before rendering (see worksheet-xform.ts prepare())
  refAddress: { row: number; col: number };
}

class VmlShapeXform extends BaseXform {
  static V_SHAPE_ATTRIBUTES: (model: VmlShapeModel, index: number) => Record<string, unknown>;

  override map: {
    'v:textbox': VmlTextboxXform;
    'x:ClientData': VmlClientDataXform;
  };

  constructor() {
    super();
    this.map = {
      'v:textbox': new VmlTextboxXform(),
      'x:ClientData': new VmlClientDataXform(),
    };
  }

  override get tag() {
    return 'v:shape';
  }

  override render(xmlStream: XmlStream, model: VmlShapeModel, index: number) {
    xmlStream.openNode('v:shape', VmlShapeXform.V_SHAPE_ATTRIBUTES(model, index));

    xmlStream.leafNode('v:fill', { color2: 'infoBackground [80]' });
    xmlStream.leafNode('v:shadow', { color: 'none [81]', obscured: 't' });
    xmlStream.leafNode('v:path', { 'o:connecttype': 'none' });
    this.map['v:textbox'].render(xmlStream, model);
    this.map['x:ClientData'].render(xmlStream, model);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case this.tag:
        this.reset();
        this.model = {
          margins: {
            insetmode: (node.attributes as Record<string, string>)['o:insetmode'],
          },
          anchor: '',
          editAs: '',
          protection: {},
        };
        break;
      default:
        this.parser = this.map[node.name as keyof VmlShapeXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
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

VmlShapeXform.V_SHAPE_ATTRIBUTES = (model: VmlShapeModel, index: number) => ({
  id: `_x0000_s${1025 + index}`,
  type: '#_x0000_t202',
  style:
    'position:absolute; margin-left:105.3pt;margin-top:10.5pt;width:97.8pt;height:59.1pt;z-index:1;visibility:hidden',
  fillcolor: 'infoBackground [80]',
  strokecolor: 'none [81]',
  'o:insetmode': model.note?.margins && model.note.margins.insetmode,
});

export default VmlShapeXform;
