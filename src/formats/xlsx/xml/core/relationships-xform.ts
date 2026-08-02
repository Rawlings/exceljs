import XmlStream from '#src/utils/stream/xml-stream';
import BaseXform from '#src/formats/xlsx/xml/base-xform';

import RelationshipXform from '#src/formats/xlsx/xml/core/relationship-xform';

class RelationshipsXform extends BaseXform {
  _values: any;
  static RELATIONSHIPS_ATTRIBUTES: any;

  constructor() {
    super();

    this.map = {
      Relationship: new RelationshipXform(),
    };
  }

  render(xmlStream: any, model: any) {
    model = model || this._values;
    xmlStream.openXml(XmlStream.StdDocAttributes);
    xmlStream.openNode('Relationships', RelationshipsXform.RELATIONSHIPS_ATTRIBUTES);

    model.forEach((relationship: any) => {
      this.map.Relationship.render(xmlStream, relationship);
    });

    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'Relationships':
        this.model = [];
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
        throw new Error(`Unexpected xml node in parseOpen: ${JSON.stringify(node)}`);
    }
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.push(this.parser.model);
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
