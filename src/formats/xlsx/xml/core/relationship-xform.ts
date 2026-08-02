import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface RelationshipModel {
  Id?: string;
  Type: string;
  Target: string;
  TargetMode?: string;
}

class RelationshipXform extends BaseXform {
  override render(xmlStream: XmlStream, model: RelationshipModel) {
    xmlStream.leafNode('Relationship', model as unknown as Record<string, unknown>);
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case 'Relationship':
        this.model = node.attributes;
        return true;
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default RelationshipXform;
