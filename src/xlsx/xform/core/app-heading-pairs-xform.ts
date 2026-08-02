import BaseXform from '#src/xlsx/xform/base-xform';

class AppHeadingPairsXform extends BaseXform {
  render(xmlStream: any, model: any) {
    xmlStream.openNode('HeadingPairs');
    xmlStream.openNode('vt:vector', { size: 2, baseType: 'variant' });

    xmlStream.openNode('vt:variant');
    xmlStream.leafNode('vt:lpstr', undefined, 'Worksheets');
    xmlStream.closeNode();

    xmlStream.openNode('vt:variant');
    xmlStream.leafNode('vt:i4', undefined, model.length);
    xmlStream.closeNode();

    xmlStream.closeNode();
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    // no parsing
    return node.name === 'HeadingPairs';
  }

  parseText() {}

  parseClose(name: any) {
    return name !== 'HeadingPairs';
  }
}

export default AppHeadingPairsXform;
