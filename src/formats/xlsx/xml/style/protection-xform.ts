import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface ProtectionModel {
  locked?: boolean;
  hidden?: boolean;
}

const validation = {
  boolean(value: boolean | undefined, dflt: boolean): boolean {
    if (value === undefined) {
      return dflt;
    }
    return value;
  },
};

// Protection encapsulates translation from style.protection model to/from xlsx
class ProtectionXform extends BaseXform {
  override get tag() {
    return 'protection';
  }

  override render(xmlStream: XmlStream, model: ProtectionModel) {
    xmlStream.addRollback();
    xmlStream.openNode('protection');

    let isValid = false;
    function add(name: string, value: unknown) {
      if (value !== undefined) {
        xmlStream.addAttribute(name, value);
        isValid = true;
      }
    }
    add('locked', validation.boolean(model.locked, true) ? undefined : '0');
    add('hidden', validation.boolean(model.hidden, false) ? '1' : undefined);

    xmlStream.closeNode();

    if (isValid) {
      xmlStream.commit();
    } else {
      xmlStream.rollback();
    }
  }

  override parseOpen(node: SaxNode) {
    const attrs = node.attributes as Record<string, string>;
    const model: ProtectionModel = {
      locked: !(attrs.locked === '0'),
      hidden: attrs.hidden === '1',
    };

    // only want to record models that differ from defaults
    const isSignificant = !model.locked || model.hidden;

    this.model = isSignificant ? model : null;
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default ProtectionXform;
