import BaseXform from '#src/formats/xlsx/xml/base-xform';

class FilterXform extends BaseXform {
  get tag() {
    return 'filter';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      val: model.val,
    });
  }

  parseOpen(node: any) {
    if (node.name === this.tag) {
      this.model = {
        val: node.attributes.val,
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

export default FilterXform;
