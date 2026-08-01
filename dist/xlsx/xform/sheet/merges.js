"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const range_1 = __importDefault(require("../../../doc/range"));
const col_cache_1 = __importDefault(require("../../../utils/col-cache"));
const enums_1 = __importDefault(require("../../../doc/enums"));
class Merges {
    constructor() {
        // optional mergeCells is array of ranges (like the xml)
        this.merges = {};
    }
    add(merge) {
        // merge is {address, master}
        if (this.merges[merge.master]) {
            this.merges[merge.master].expandToAddress(merge.address);
        }
        else {
            const range = `${merge.master}:${merge.address}`;
            this.merges[merge.master] = new range_1.default(range);
        }
    }
    get mergeCells() {
        return under_dash_1.default.map(this.merges, (merge) => merge.range);
    }
    reconcile(mergeCells, rows) {
        // reconcile merge list with merge cells
        under_dash_1.default.each(mergeCells, (merge) => {
            const dimensions = col_cache_1.default.decode(merge);
            for (let i = dimensions.top; i <= dimensions.bottom; i++) {
                const row = rows[i - 1];
                for (let j = dimensions.left; j <= dimensions.right; j++) {
                    const cell = row.cells[j - 1];
                    if (!cell) {
                        // nulls are not included in document - so if master cell has no value - add a null one here
                        row.cells[j] = {
                            type: enums_1.default.ValueType.Null,
                            address: col_cache_1.default.encodeAddress(i, j),
                        };
                    }
                    else if (cell.type === enums_1.default.ValueType.Merge) {
                        cell.master = dimensions.tl;
                    }
                }
            }
        });
    }
    getMasterAddress(address) {
        // if address has been merged, return its master's address. Assumes reconcile has been called
        const range = this.hash[address];
        return range && range.tl;
    }
}
exports.default = Merges;
