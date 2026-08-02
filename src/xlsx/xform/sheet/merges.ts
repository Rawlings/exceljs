import _ from '#src/utils/helpers/under-dash';

import Range from '#src/models/range';
import colCache from '#src/utils/data/col-cache';
import Enums from '#src/models/enums';

class Merges {
  merges: any;
  hash: any;

  constructor() {
    // optional mergeCells is array of ranges (like the xml)
    this.merges = {};
    this.hash = {};
  }

  add(merge: any) {
    // merge is {address, master}
    if (this.merges[merge.master]) {
      this.merges[merge.master].expandToAddress(merge.address);
    } else {
      const range = `${merge.master}:${merge.address}`;
      this.merges[merge.master] = new Range(range as any);
    }
  }

  get mergeCells() {
    return _.map(this.merges, (merge: any) => merge.range);
  }

  reconcile(mergeCells: any, rows: any) {
    // reconcile merge list with merge cells
    _.each(mergeCells, (merge: any) => {
      const dimensions = colCache.decode(merge) as any;
      for (let i = dimensions.top; i <= dimensions.bottom; i++) {
        const row = rows[i - 1];
        for (let j = dimensions.left; j <= dimensions.right; j++) {
          const cell = row.cells[j - 1];
          if (!cell) {
            // nulls are not included in document - so if master cell has no value - add a null one here
            row.cells[j] = {
              type: Enums.ValueType.Null,
              address: colCache.encodeAddress(i, j),
            };
          } else if (cell.type === Enums.ValueType.Merge) {
            cell.master = dimensions.tl;
          }
        }
      }
    });
  }

  getMasterAddress(address: any) {
    // if address has been merged, return its master's address. Assumes reconcile has been called
    const range = this.hash[address];
    return range && range.tl;
  }
}

export default Merges;
