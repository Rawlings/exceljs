import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

//   <t xml:space="preserve"> is </t>

class TextXform extends BaseXform {
  _text!: string[];

  override get tag() {
    return 't';
  }

  override render(xmlStream: XmlStream, model: string | undefined) {
    xmlStream.openNode('t');
    if (/^\s|\n|\s$/.test(model as string)) {
      xmlStream.addAttribute('xml:space', 'preserve');
    }
    xmlStream.writeText(model);
    xmlStream.closeNode();
  }

  override get model(): string {
    return this._text
      .join('')
      .replace(/_x([0-9A-F]{4})_/g, (_$0, $1) => String.fromCharCode(parseInt($1, 16)));
  }

  override set model(val: string[]) {
    this._text = val;
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case 't':
        this._text = [];
        return true;
      default:
        return false;
    }
  }

  override parseText(text: string) {
    this._text.push(text);
  }

  override parseClose() {
    return false;
  }
}

export default TextXform;
