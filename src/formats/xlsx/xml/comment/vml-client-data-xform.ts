import BaseXform from '../base-xform';

import VmlAnchorXform from './vml-anchor-xform';
import VmlProtectionXform from './style/vml-protection-xform';
import VmlPositionXform from './style/vml-position-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

const POSITION_TYPE = ['twoCells', 'oneCells', 'absolute'];

interface VmlClientDataModel {
  note?: { protection?: { locked?: unknown; lockText?: unknown }; editAs?: string };
  protection?: { locked?: unknown; lockText?: unknown };
  editAs?: string;
  refAddress: { row: number; col: number };
}

class VmlClientDataXform extends BaseXform {
  override map: {
    'x:Anchor': VmlAnchorXform;
    'x:Locked': VmlProtectionXform;
    'x:LockText': VmlProtectionXform;
    'x:SizeWithCells': VmlPositionXform;
    'x:MoveWithCells': VmlPositionXform;
  };

  constructor() {
    super();
    this.map = {
      'x:Anchor': new VmlAnchorXform(),
      'x:Locked': new VmlProtectionXform({ tag: 'x:Locked' }),
      'x:LockText': new VmlProtectionXform({ tag: 'x:LockText' }),
      'x:SizeWithCells': new VmlPositionXform({ tag: 'x:SizeWithCells' }),
      'x:MoveWithCells': new VmlPositionXform({ tag: 'x:MoveWithCells' }),
    };
  }

  override get tag() {
    return 'x:ClientData';
  }

  override render(xmlStream: XmlStream, model: VmlClientDataModel) {
    const note = typeof model.note === 'object' ? model.note : model;
    const protection = note?.protection || {};
    const editAs = note?.editAs || 'twoCells';
    xmlStream.openNode(this.tag, { ObjectType: 'Note' });
    this.map['x:MoveWithCells'].render(xmlStream, editAs, POSITION_TYPE);
    this.map['x:SizeWithCells'].render(xmlStream, editAs, POSITION_TYPE);
    this.map['x:Anchor'].render(xmlStream, model);
    this.map['x:Locked'].render(xmlStream, protection.locked);
    xmlStream.leafNode('x:AutoFill', undefined, 'False');
    this.map['x:LockText'].render(xmlStream, protection.lockText);
    xmlStream.leafNode('x:Row', undefined, model.refAddress.row - 1);
    xmlStream.leafNode('x:Column', undefined, model.refAddress.col - 1);
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case this.tag:
        this.reset();
        this.model = {
          anchor: [],
          protection: {},
          editAs: '',
        };
        break;
      default:
        this.parser = this.map[node.name as keyof VmlClientDataXform['map']];
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
        this.normalizeModel();
        return false;
      default:
        return true;
    }
  }

  normalizeModel() {
    const hasMove = !!this.map['x:MoveWithCells'].model;
    const hasSize = !!this.map['x:SizeWithCells'].model;
    if (hasMove && hasSize) {
      this.model.editAs = 'twoCells';
    } else if (hasMove) {
      this.model.editAs = 'oneCells';
    } else {
      this.model.editAs = 'absolute';
    }
    this.model.anchor = this.map['x:Anchor'].text;
    this.model.protection.locked = this.map['x:Locked'].text;
    this.model.protection.lockText = this.map['x:LockText'].text;
  }
}

export default VmlClientDataXform;
