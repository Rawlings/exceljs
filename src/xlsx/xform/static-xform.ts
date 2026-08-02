import BaseXform from '#src/xlsx/xform/base-xform';
import XmlStream from '#src/utils/stream/xml-stream';

// const model = {
//   tag: 'name',
//   $: {attr: 'value'},
//   c: [
//     { tag: 'child' }
//   ],
//   t: 'some text'
// };

function build(xmlStream: any, model: any) {
  xmlStream.openNode(model.tag, model.$);
  if (model.c) {
    model.c.forEach((child: any) => {
      build(xmlStream, child);
    });
  }
  if (model.t) {
    xmlStream.writeText(model.t);
  }
  xmlStream.closeNode();
}

class StaticXform extends BaseXform {
  declare _model: any;
  _xml: any;

  constructor(model?: any) {
    super();

    // This class is an optimisation for static (unimportant and unchanging) xml
    // It is stateless - apart from its static model and so can be used as a singleton
    // Being stateless - it will only track entry to and exit from it's root xml tag during parsing and nothing else
    // Known issues:
    //    since stateless - parseOpen always returns true. Parent xform must know when to start using this xform
    //    if the root tag is recursive, the parsing will behave unpredictably
    this._model = model;
  }

  render(xmlStream: any) {
    if (!this._xml) {
      const stream = new XmlStream();
      build(stream, this._model);
      this._xml = stream.xml;
    }
    xmlStream.writeXml(this._xml);
  }

  override reset(): void {
    // StaticXform is stateless by design — _model holds the static config, not parse state
  }

  override get model() {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override set model(_val: any) {}

  parseOpen() {
    return true;
  }

  parseText() {}

  parseClose(name: any) {
    switch (name) {
      case this._model?.tag:
        return false;
      default:
        return true;
    }
  }
}

export default StaticXform;
