import _ from '#src/utils/under-dash';

import utils from '#src/utils/utils';

// constants
const OPEN_ANGLE = '<';
const CLOSE_ANGLE = '>';
const OPEN_ANGLE_SLASH = '</';
const CLOSE_SLASH_ANGLE = '/>';

function pushAttribute(xml: any, name: any, value: any) {
  xml.push(` ${name}="${utils.xmlEncode(value.toString())}"`);
}
function pushAttributes(xml: any, attributes: any) {
  if (attributes) {
    const tmp: any[] = [];
    _.each(attributes, (value: any, name: any) => {
      if (value !== undefined) {
        pushAttribute(tmp, name, value);
      }
    });
    xml.push(tmp.join(''));
  }
}

class XmlStream {
  static StdDocAttributes: any;
  _xml: any[];
  _stack: any[];
  _rollbacks: any[];
  open: boolean = false;
  leaf: boolean = false;

  constructor() {
    this._xml = [];
    this._stack = [];
    this._rollbacks = [];
  }

  get tos() {
    return this._stack.length ? this._stack[this._stack.length - 1] : undefined;
  }

  get cursor() {
    // handy way to track whether anything has been added
    return this._xml.length;
  }

  openXml(docAttributes: any) {
    const xml = this._xml;
    // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    xml.push('<?xml');
    pushAttributes(xml, docAttributes);
    xml.push('?>\n');
  }

  openNode(name: any, attributes?: any) {
    const parent = this.tos;
    const xml = this._xml;
    if (parent && this.open) {
      xml.push(CLOSE_ANGLE);
    }

    this._stack.push(name);

    // start streaming node
    xml.push(OPEN_ANGLE);
    xml.push(name);
    pushAttributes(xml, attributes);
    this.leaf = true;
    this.open = true;
  }

  addAttribute(name: any, value: any) {
    if (!this.open) {
      throw new Error('Cannot write attributes to node if it is not open');
    }
    if (value !== undefined) {
      pushAttribute(this._xml, name, value);
    }
  }

  addAttributes(attrs: any) {
    if (!this.open) {
      throw new Error('Cannot write attributes to node if it is not open');
    }
    pushAttributes(this._xml, attrs);
  }

  writeText(text: any) {
    const xml = this._xml;
    if (this.open) {
      xml.push(CLOSE_ANGLE);
      this.open = false;
    }
    this.leaf = false;
    xml.push(utils.xmlEncode(text.toString()));
  }

  writeXml(xml: any) {
    if (this.open) {
      this._xml.push(CLOSE_ANGLE);
      this.open = false;
    }
    this.leaf = false;
    this._xml.push(xml);
  }

  closeNode() {
    const node = this._stack.pop();
    const xml = this._xml;
    if (this.leaf) {
      xml.push(CLOSE_SLASH_ANGLE);
    } else {
      xml.push(OPEN_ANGLE_SLASH);
      xml.push(node);
      xml.push(CLOSE_ANGLE);
    }
    this.open = false;
    this.leaf = false;
  }

  leafNode(name: any, attributes: any, text: any) {
    this.openNode(name, attributes);
    if (text !== undefined) {
      // zeros need to be written
      this.writeText(text);
    }
    this.closeNode();
  }

  closeAll() {
    while (this._stack.length) {
      this.closeNode();
    }
  }

  addRollback() {
    this._rollbacks.push({
      xml: this._xml.length,
      stack: this._stack.length,
      leaf: this.leaf,
      open: this.open,
    });
    return this.cursor;
  }

  commit() {
    this._rollbacks.pop();
  }

  rollback() {
    const r = this._rollbacks.pop();
    if (this._xml.length > r.xml) {
      this._xml.splice(r.xml, this._xml.length - r.xml);
    }
    if (this._stack.length > r.stack) {
      this._stack.splice(r.stack, this._stack.length - r.stack);
    }
    this.leaf = r.leaf;
    this.open = r.open;
  }

  get xml() {
    this.closeAll();
    return this._xml.join('');
  }
}

XmlStream.StdDocAttributes = {
  version: '1.0',
  encoding: 'UTF-8',
  standalone: 'yes',
};

export default XmlStream;
