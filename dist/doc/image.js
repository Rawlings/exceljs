"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const col_cache_1 = __importDefault(require("../utils/col-cache"));
const anchor_1 = __importDefault(require("./anchor"));
class Image {
    worksheet;
    type;
    imageId;
    range;
    constructor(worksheet, model) {
        this.worksheet = worksheet;
        if (model) {
            this.model = model;
        }
    }
    get model() {
        switch (this.type) {
            case 'background':
                return {
                    type: this.type,
                    imageId: this.imageId,
                };
            case 'image':
                return {
                    type: this.type,
                    imageId: this.imageId,
                    hyperlinks: this.range.hyperlinks,
                    range: {
                        tl: this.range.tl.model,
                        br: this.range.br && this.range.br.model,
                        ext: this.range.ext,
                        editAs: this.range.editAs,
                    },
                };
            default:
                throw new Error('Invalid Image Type');
        }
    }
    set model({ type, imageId, range, hyperlinks }) {
        this.type = type;
        this.imageId = imageId;
        if (type === 'image') {
            if (typeof range === 'string') {
                const decoded = col_cache_1.default.decode(range);
                this.range = {
                    tl: new anchor_1.default(this.worksheet, { col: decoded.left, row: decoded.top }, -1),
                    br: new anchor_1.default(this.worksheet, { col: decoded.right, row: decoded.bottom }, 0),
                    editAs: 'oneCell',
                };
            }
            else {
                this.range = {
                    tl: new anchor_1.default(this.worksheet, range.tl, 0),
                    br: range.br && new anchor_1.default(this.worksheet, range.br, 0),
                    ext: range.ext,
                    editAs: range.editAs,
                    hyperlinks: hyperlinks || range.hyperlinks,
                };
            }
        }
    }
}
exports.default = Image;
