import BaseXform from '#src/xlsx/xform/base-xform';

//   <t xml:space="preserve"> is </t>

class TextXform extends BaseXform {
  _text!: any;

  get tag() {
    return 't';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode('t');
    if (/^\s|\n|\s$/.test(model)) {
      xmlStream.addAttribute('xml:space', 'preserve');
    }
    xmlStream.writeText(model);
    xmlStream.closeNode();
  }

  get model() {
    return this._text
      .join('')
      .replace(/_x([0-9A-F]{4})_/g, ($0: any, $1: any) => String.fromCharCode(parseInt($1, 16)));
  }

  set model(val: any) {
    this._text = val;
  }

  parseOpen(node: any) {
    switch (node.name) {
      case 't':
        this._text = [];
        return true;
      default:
        return false;
    }
  }

  parseText(text: any) {
    this._text.push(text);
  }

  parseClose() {
    return false;
  }
}

export default TextXform;
