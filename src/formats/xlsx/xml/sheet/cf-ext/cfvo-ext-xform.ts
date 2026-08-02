import CompositeXform from '../../composite-xform';

import FExtXform from './f-ext-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';
import type { SaxNode } from '../../base-xform';

export interface CfvoExtModel {
  type: string;
  value?: number | string;
}

class CfvoExtXform extends CompositeXform {
  fExtXform: FExtXform;

  constructor() {
    super();

    this.map = {
      'xm:f': (this.fExtXform = new FExtXform()),
    };
  }

  override get tag() {
    return 'x14:cfvo';
  }

  override render(xmlStream: XmlStream, model: CfvoExtModel) {
    xmlStream.openNode(this.tag, {
      type: model.type,
    });
    if (model.value !== undefined) {
      this.fExtXform.render(xmlStream, String(model.value));
    }
    xmlStream.closeNode();
  }

  override createNewModel(node: SaxNode): CfvoExtModel {
    const attrs = node.attributes as Record<string, string>;
    return {
      type: attrs.type,
    };
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    switch (name) {
      case 'xm:f':
        this.model.value = parser.model ? parseFloat(parser.model as string) : 0;
        break;
    }
  }
}

export default CfvoExtXform;
