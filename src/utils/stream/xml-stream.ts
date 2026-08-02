import _ from '#src/utils/helpers/under-dash';
import utils from '#src/utils/helpers/utils';

const OPEN_ANGLE = '<';
const CLOSE_ANGLE = '>';
const OPEN_ANGLE_SLASH = '</';
const CLOSE_SLASH_ANGLE = '/>';

function pushAttribute(xml: string[], name: string, value: any) {
  xml.push(` ${name}="${utils.xmlEncode(value.toString())}"`);
}

function pushAttributes(xml: string[], attributes: Record<string, any>) {
  if (attributes) {
    const tmp: string[] = [];
    _.each(attributes, (value: any, name: string) => {
      if (value !== undefined) {
        pushAttribute(tmp, name, value);
      }
    });
    xml.push(tmp.join(''));
  }
}

class XmlStream {
  static StdDocAttributes = {
    version: '1.0',
    encoding: 'UTF-8',
    standalone: 'yes',
  };

  private _xml: string[];
  private _stack: string[];
  private _rollbacks: Array<{
    xml: number;
    stack: number;
    leaf: boolean;
    open: boolean;
  }>;

  open = false;
  leaf = false;

  constructor() {
    this._xml = [];
    this._stack = [];
    this._rollbacks = [];
  }

  get tos(): string | undefined {
    return this._stack.length ? this._stack[this._stack.length - 1] : undefined;
  }

  get cursor(): number {
    return this._xml.length;
  }

  openXml(docAttributes: Record<string, any>): void {
    const xml = this._xml;
    xml.push('<?xml');
    pushAttributes(xml, docAttributes);
    xml.push('?>\n');
  }

  openNode(name: string, attributes?: Record<string, any>): void {
    const parent = this.tos;
    const xml = this._xml;
    if (parent && this.open) {
      xml.push(CLOSE_ANGLE);
    }

    this._stack.push(name);
    xml.push(OPEN_ANGLE);
    xml.push(name);
    if (attributes) {
      pushAttributes(xml, attributes);
    }
    this.leaf = true;
    this.open = true;
  }

  addAttribute(name: string, value: any): void {
    if (!this.open) {
      throw new Error('Cannot write attributes to node if it is not open');
    }
    if (value !== undefined) {
      pushAttribute(this._xml, name, value);
    }
  }

  addAttributes(attrs: Record<string, any>): void {
    if (!this.open) {
      throw new Error('Cannot write attributes to node if it is not open');
    }
    pushAttributes(this._xml, attrs);
  }

  writeText(text: any): void {
    const xml = this._xml;
    if (this.open) {
      xml.push(CLOSE_ANGLE);
      this.open = false;
    }
    this.leaf = false;
    xml.push(utils.xmlEncodeText(text.toString()));
  }

  writeXml(xml: string): void {
    if (this.open) {
      this._xml.push(CLOSE_ANGLE);
      this.open = false;
    }
    this.leaf = false;
    this._xml.push(xml);
  }

  closeNode(): void {
    const node = this._stack.pop();
    const xml = this._xml;
    if (this.leaf) {
      xml.push(CLOSE_SLASH_ANGLE);
    } else {
      xml.push(OPEN_ANGLE_SLASH);
      xml.push(node!);
      xml.push(CLOSE_ANGLE);
    }
    this.open = false;
    this.leaf = false;
  }

  leafNode(name: string, attributes?: Record<string, any>, text?: any): void {
    this.openNode(name, attributes);
    if (text !== undefined) {
      this.writeText(text);
    }
    this.closeNode();
  }

  closeAll(): void {
    while (this._stack.length) {
      this.closeNode();
    }
  }

  addRollback(): number {
    this._rollbacks.push({
      xml: this._xml.length,
      stack: this._stack.length,
      leaf: this.leaf,
      open: this.open,
    });
    return this.cursor;
  }

  commit(): void {
    this._rollbacks.pop();
  }

  rollback(): void {
    const r = this._rollbacks.pop();
    if (!r) return;
    if (this._xml.length > r.xml) {
      this._xml.splice(r.xml, this._xml.length - r.xml);
    }
    if (this._stack.length > r.stack) {
      this._stack.splice(r.stack, this._stack.length - r.stack);
    }
    this.leaf = r.leaf;
    this.open = r.open;
  }

  get xml(): string {
    this.closeAll();
    return this._xml.join('');
  }
}

export default XmlStream;
