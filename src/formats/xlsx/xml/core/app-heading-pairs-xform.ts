import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

class AppHeadingPairsXform extends BaseXform {
  override render(xmlStream: XmlStream, model: unknown[]) {
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

  override parseOpen(node: SaxNode) {
    // no parsing
    return node.name === 'HeadingPairs';
  }

  override parseText() {}

  override parseClose(name: string) {
    return name !== 'HeadingPairs';
  }
}

export default AppHeadingPairsXform;
