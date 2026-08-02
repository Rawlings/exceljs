import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export type UnderlineValue =
  | boolean
  | 'single'
  | 'double'
  | 'singleAccounting'
  | 'doubleAccounting';

class UnderlineXform extends BaseXform {
  static Attributes: Record<string, Record<string, string>>;

  constructor(model?: UnderlineValue) {
    super();

    this.model = model;
  }

  override get tag() {
    return 'u';
  }

  override render(xmlStream: XmlStream, model?: UnderlineValue) {
    model = model || (this.model as UnderlineValue);

    if (model === true) {
      xmlStream.leafNode('u');
    } else {
      const attr = UnderlineXform.Attributes[model as string];
      if (attr) {
        xmlStream.leafNode('u', attr);
      }
    }
  }

  override parseOpen(node: SaxNode) {
    if (node.name === 'u') {
      this.model = (node.attributes as Record<string, string>)?.val || true;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

UnderlineXform.Attributes = {
  single: {},
  double: { val: 'double' },
  singleAccounting: { val: 'singleAccounting' },
  doubleAccounting: { val: 'doubleAccounting' },
};

export default UnderlineXform;
