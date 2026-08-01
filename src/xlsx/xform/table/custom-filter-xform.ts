import BaseXform from '../base-xform';

class CustomFilterXform extends BaseXform {
  get tag() {
    return 'customFilter';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      val: model.val,
      operator: model.operator,
    });
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      this.model = {
        val: node.attributes.val,
        operator: node.attributes.operator,
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

export default CustomFilterXform;
