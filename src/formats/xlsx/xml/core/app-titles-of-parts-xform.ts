import BaseXform from '#src/formats/xlsx/xml/base-xform';

class AppTitlesOfPartsXform extends BaseXform {
  render(xmlStream: any, model: any) {
    xmlStream.openNode('TitlesOfParts');
    xmlStream.openNode('vt:vector', { size: model.length, baseType: 'lpstr' });

    model.forEach((sheet: any) => {
      xmlStream.leafNode('vt:lpstr', undefined, sheet.name);
    });

    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    // no parsing
    return node.name === 'TitlesOfParts';
  }

  parseText() {}

  parseClose(name: any) {
    return name !== 'TitlesOfParts';
  }
}

export default AppTitlesOfPartsXform;
