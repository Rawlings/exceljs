import BaseXform from '../base-xform';

class PageBreaksXform extends BaseXform {
  get tag() {
    return 'brk';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode('brk', model);
  }

  parseOpen(node: any) {
    if (node.name === 'brk') {
      this.model = node.attributes.ref;
      return true;
    }
    return false;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default PageBreaksXform;
