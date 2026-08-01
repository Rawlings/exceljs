import BaseXform from '../base-xform';

const validation = {
  boolean(value: any, dflt: any) {
    if (value === undefined) {
      return dflt;
    }
    return value;
  },
};

// Protection encapsulates translation from style.protection model to/from xlsx
class ProtectionXform extends BaseXform {
  get tag() {
    return 'protection';
  }

  render(xmlStream: any, model: any) {
    xmlStream.addRollback();
    xmlStream.openNode('protection');

    let isValid = false;
    function add(name: any, value: any) {
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

  parseOpen(node: any) {
    const model = {
      locked: !(node.attributes.locked === '0'),
      hidden: node.attributes.hidden === '1',
    };

    // only want to record models that differ from defaults
    const isSignificant = !model.locked || model.hidden;

    this.model = isSignificant ? model : null;
  }

  parseText() {}

  parseClose() {
    return false;
  }
}

export default ProtectionXform;
