import colCache from '#src/utils/data/col-cache';
import BaseXform from '#src/formats/xlsx/xml/base-xform';

class AutoFilterXform extends BaseXform {
  get tag() {
    return 'autoFilter';
  }

  render(xmlStream: any, model: any) {
    if (model) {
      if (typeof model === 'string') {
        // assume range
        xmlStream.leafNode('autoFilter', { ref: model });
      } else {
        const getAddress = function (addr: any) {
          if (typeof addr === 'string') {
            return addr;
          }
          return colCache.getAddress(addr.row, addr.column).address;
        };

        const firstAddress = getAddress(model.from);
        const secondAddress = getAddress(model.to);
        if (firstAddress && secondAddress) {
          xmlStream.leafNode('autoFilter', { ref: `${firstAddress}:${secondAddress}` });
        }
      }
    }
  }

  parseOpen(node: any) {
    if (node.name === 'autoFilter') {
      this.model = node.attributes.ref;
    }
  }
}

export default AutoFilterXform;
