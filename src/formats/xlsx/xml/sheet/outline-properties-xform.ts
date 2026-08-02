import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface OutlinePropertiesModel {
  summaryBelow?: boolean;
  summaryRight?: boolean;
}

const isDefined = (attr: unknown) => typeof attr !== 'undefined';

class OutlinePropertiesXform extends BaseXform {
  override get tag() {
    return 'outlinePr';
  }

  override render(xmlStream: XmlStream, model: OutlinePropertiesModel | undefined) {
    if (model && (isDefined(model.summaryBelow) || isDefined(model.summaryRight))) {
      xmlStream.leafNode(this.tag as string, {
        summaryBelow: isDefined(model.summaryBelow) ? Number(model.summaryBelow) : undefined,
        summaryRight: isDefined(model.summaryRight) ? Number(model.summaryRight) : undefined,
      });
      return true;
    }
    return false;
  }

  override parseOpen(node: SaxNode) {
    if (node.name === this.tag) {
      const attrs = node.attributes as Record<string, string>;
      this.model = {
        summaryBelow: isDefined(attrs.summaryBelow)
          ? Boolean(Number(attrs.summaryBelow))
          : undefined,
        summaryRight: isDefined(attrs.summaryRight)
          ? Boolean(Number(attrs.summaryRight))
          : undefined,
      };
      return true;
    }
    return false;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default OutlinePropertiesXform;
