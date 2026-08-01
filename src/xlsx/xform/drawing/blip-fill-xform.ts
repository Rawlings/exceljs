import BaseXform from '../base-xform';
import BlipXform from './blip-xform';

class BlipFillXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      'a:blip': new BlipXform(),
    };
  }

  get tag() {
    return 'xdr:blipFill';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag);

    this.map['a:blip'].render(xmlStream, model);

    // TODO: options for this + parsing
    xmlStream.openNode('a:stretch');
    xmlStream.leafNode('a:fillRect');
    xmlStream.closeNode();

    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }

    switch (node.name) {
      case this.tag:
        this.reset();
        break;

      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  parseText() {}

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        this.model = this.map['a:blip'].model;
        return false;

      default:
        return true;
    }
  }
}

export default BlipFillXform;
