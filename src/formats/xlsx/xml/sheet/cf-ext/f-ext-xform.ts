import BaseXform from '../../base-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';

class FExtXform extends BaseXform {
  override get tag() {
    return 'xm:f';
  }

  override render(xmlStream: XmlStream, model: string) {
    xmlStream.leafNode(this.tag as string, undefined, model);
  }

  override parseOpen() {
    this.model = '';
  }

  override parseText(text: string) {
    this.model += text;
  }

  override parseClose(name: string) {
    return name !== this.tag;
  }
}

export default FExtXform;
