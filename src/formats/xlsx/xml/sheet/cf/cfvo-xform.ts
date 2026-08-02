import BaseXform from '#src/formats/xlsx/xml/base-xform';

class CfvoXform extends BaseXform {
  get tag() {
    return 'cfvo';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      type: model.type,
      val: model.value,
    });
  }

  parseOpen(node: any) {
    this.model = {
      type: node.attributes.type,
      value: BaseXform.toFloatValue(node.attributes.val),
    };
  }

  parseClose(name: any) {
    return name !== this.tag;
  }
}

export default CfvoXform;
