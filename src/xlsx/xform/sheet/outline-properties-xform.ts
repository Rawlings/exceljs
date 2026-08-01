import BaseXform from '../base-xform';

const isDefined = (attr: any) => typeof attr !== 'undefined';

class OutlinePropertiesXform extends BaseXform {
  get tag() {
    return 'outlinePr';
  }

  render(xmlStream: any, model: any) {
    if (model && (isDefined(model.summaryBelow) || isDefined(model.summaryRight))) {
      xmlStream.leafNode(this.tag, {
        summaryBelow: isDefined(model.summaryBelow) ? Number(model.summaryBelow) : undefined,
        summaryRight: isDefined(model.summaryRight) ? Number(model.summaryRight) : undefined,
      });
      return true;
    }
    return false;
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      this.model = {
        summaryBelow: isDefined(node.attributes.summaryBelow)
          ? Boolean(Number(node.attributes.summaryBelow))
          : undefined,
        summaryRight: isDefined(node.attributes.summaryRight)
          ? Boolean(Number(node.attributes.summaryRight))
          : undefined,
      };
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default OutlinePropertiesXform;
