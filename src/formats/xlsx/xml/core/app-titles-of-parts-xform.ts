import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

class AppTitlesOfPartsXform extends BaseXform {
  override render(xmlStream: XmlStream, model: { name: string }[]) {
    xmlStream.openNode('TitlesOfParts');
    xmlStream.openNode('vt:vector', { size: model.length, baseType: 'lpstr' });

    model.forEach((sheet) => {
      xmlStream.leafNode('vt:lpstr', undefined, sheet.name);
    });

    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    // no parsing
    return node.name === 'TitlesOfParts';
  }

  override parseText() {}

  override parseClose(name: string) {
    return name !== 'TitlesOfParts';
  }
}

export default AppTitlesOfPartsXform;
