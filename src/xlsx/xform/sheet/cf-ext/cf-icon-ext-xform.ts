import BaseXform from '#src/xlsx/xform/base-xform';

class CfIconExtXform extends BaseXform {
  get tag() {
    return 'x14:cfIcon';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, {
      iconSet: model.iconSet,
      iconId: model.iconId,
    });
  }

  parseOpen({ attributes }: any) {
    this.model = {
      iconSet: attributes.iconSet,
      iconId: BaseXform.toIntValue(attributes.iconId),
    };
  }

  parseClose(name: any) {
    return name !== this.tag;
  }
}

export default CfIconExtXform;
