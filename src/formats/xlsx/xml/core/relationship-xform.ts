import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

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
