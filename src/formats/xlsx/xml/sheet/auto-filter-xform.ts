import colCache from '#src/utils/data/col-cache';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface AutoFilterAddress {
  row: number;
  column: number;
}

export interface AutoFilterRangeModel {
  from: string | AutoFilterAddress;
  to: string | AutoFilterAddress;
}

export type AutoFilterModel = string | AutoFilterRangeModel;

class AutoFilterXform extends BaseXform {
  override get tag() {
    return 'autoFilter';
  }

  override render(xmlStream: XmlStream, model: AutoFilterModel | undefined) {
    if (model) {
      if (typeof model === 'string') {
        // assume range
        xmlStream.leafNode('autoFilter', { ref: model });
      } else {
        const getAddress = function (addr: string | AutoFilterAddress) {
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

  override parseOpen(node: SaxNode) {
    if (node.name === 'autoFilter') {
      this.model = (node.attributes as Record<string, string>).ref;
    }
  }
}

export default AutoFilterXform;
