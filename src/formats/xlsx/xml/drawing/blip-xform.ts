import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface BlipModel {
  rId: string;
}

class BlipXform extends BaseXform {
  override get tag() {
    return 'a:blip';
  }

  override render(xmlStream: XmlStream, model: BlipModel) {
    xmlStream.leafNode(this.tag as string, {
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'r:embed': model.rId,
      cstate: 'print',
    });
    // TODO: handle children (e.g. a:extLst=>a:ext=>a14:useLocalDpi
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case this.tag:
        this.model = {
          rId: (node.attributes as Record<string, string>)['r:embed'],
        };
        return true;
      default:
        return true;
    }
  }

  override parseText() {}

  override parseClose(name?: string) {
    switch (name) {
      case this.tag:
        return false;
      default:
        // unprocessed internal nodes
        return true;
    }
  }
}

export default BlipXform;
