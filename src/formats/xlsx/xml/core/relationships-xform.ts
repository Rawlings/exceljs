import XmlStream from '#src/utils/stream/xml-stream';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

import RelationshipXform from '#src/formats/xlsx/xml/core/relationship-xform';
import type { RelationshipModel } from '#src/formats/xlsx/xml/core/relationship-xform';

class RelationshipsXform extends BaseXform {
  _values: RelationshipModel[] | undefined;
  static RELATIONSHIPS_ATTRIBUTES: Record<string, string>;
  override map: { Relationship: RelationshipXform };

  constructor() {
    super();

    this.map = {
      Relationship: new RelationshipXform(),
    };
  }

  override render(xmlStream: XmlStream, modelInput?: RelationshipModel[]) {
    const model = modelInput || (this._values as RelationshipModel[]);
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('Relationships', RelationshipsXform.RELATIONSHIPS_ATTRIBUTES);

    model.forEach((relationship) => {
      this.map.Relationship.render(xmlStream, relationship);
    });

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'Relationships':
        this.model = [];
        return true;
      default:
        this.parser = this.map[node.name as keyof RelationshipsXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
        throw new Error(`Unexpected xml node in parseOpen: ${JSON.stringify(node)}`);
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        (this.model as RelationshipModel[]).push(this.parser.model);
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case 'Relationships':
        return false;
      default:
        throw new Error(`Unexpected xml node in parseClose: ${name}`);
    }
  }
}

RelationshipsXform.RELATIONSHIPS_ATTRIBUTES = {
  xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships',
};

export default RelationshipsXform;
