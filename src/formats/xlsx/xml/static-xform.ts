import BaseXform from './base-xform';
import XmlStream from '../../../utils/stream/xml-stream';

export interface StaticNode {
  tag: string;
  $?: Record<string, unknown>;
  c?: StaticNode[];
  t?: string;
}

function build(xmlStream: XmlStream, model: StaticNode) {
  xmlStream.openNode(model.tag, model.$);
  if (model.c) {
    model.c.forEach((child) => {
      build(xmlStream, child);
    });
  }
  if (model.t) {
    xmlStream.writeText(model.t);
  }
  xmlStream.closeNode();
}

class StaticXform extends BaseXform {
  declare _model: StaticNode | undefined;
  _xml: string | undefined;

  constructor(model?: StaticNode) {
    super();

    // This class is an optimisation for static (unimportant and unchanging) xml
    // It is stateless - apart from its static model and so can be used as a singleton
    // Being stateless - it will only track entry to and exit from it's root xml tag during parsing and nothing else
    // Known issues:
    //    since stateless - parseOpen always returns true. Parent xform must know when to start using this xform
    //    if the root tag is recursive, the parsing will behave unpredictably
    this._model = model;
  }

  override render(xmlStream: XmlStream) {
    if (!this._xml) {
      const stream = new XmlStream();
      build(stream, this._model as StaticNode);
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
  override set model(_val: unknown) {}

  override parseOpen() {
    return true;
  }

  override parseText() {}

  override parseClose(name: string) {
    switch (name) {
      case this._model?.tag:
        return false;
      default:
        return true;
    }
  }
}

export default StaticXform;
