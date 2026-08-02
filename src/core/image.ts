import colCache from '#src/utils/data/col-cache';
import Anchor from '#src/core/anchor';
import type { AnchorWorksheet, AnchorModel } from '#src/core/anchor';

export type ImageType = 'background' | 'image';

export interface ImageRangeInput {
  tl: AnchorModel | string | { col?: number; row?: number };
  br?: AnchorModel | { col?: number; row?: number };
  ext?: { width: number; height: number };
  editAs?: string;
  hyperlinks?: unknown;
}

export interface ImageModel {
  type: ImageType;
  imageId: number;
  range?: string | ImageRangeInput;
  hyperlinks?: unknown;
}

interface ImageRange {
  tl: Anchor;
  br?: Anchor;
  ext?: { width: number; height: number };
  editAs?: string;
  hyperlinks?: unknown;
}

class Image {
  worksheet: AnchorWorksheet | undefined;
  type: ImageType | undefined;
  imageId: number | undefined;
  range: ImageRange | undefined;

  constructor(worksheet?: AnchorWorksheet, model?: ImageModel) {
    this.worksheet = worksheet;
    if (model) {
      this.model = model;
    }
  }

  get model(): Record<string, unknown> {
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
          hyperlinks: (this.range as ImageRange).hyperlinks,
          range: {
            tl: (this.range as ImageRange).tl.model,
            br: (this.range as ImageRange).br && (this.range as ImageRange).br!.model,
            ext: (this.range as ImageRange).ext,
            editAs: (this.range as ImageRange).editAs,
          },
        };
      default:
        throw new Error('Invalid Image Type');
    }
  }

  set model({ type, imageId, range, hyperlinks }: ImageModel) {
    this.type = type;
    this.imageId = imageId;

    if (type === 'image') {
      if (typeof range === 'string') {
        const decoded = colCache.decode(range) as {
          left: number;
          top: number;
          right: number;
          bottom: number;
        };
        this.range = {
          tl: new Anchor(this.worksheet, { col: decoded.left, row: decoded.top }, -1),
          br: new Anchor(this.worksheet, { col: decoded.right, row: decoded.bottom }, 0),
          editAs: 'oneCell',
        };
      } else {
        // NB: matches original behavior — if `range` is undefined here,
        // this throws (range.tl on undefined), same as the untyped original.
        const r = range as ImageRangeInput;
        this.range = {
          tl: new Anchor(this.worksheet, r.tl, 0),
          br: r.br && new Anchor(this.worksheet, r.br, 0),
          ext: r.ext,
          editAs: r.editAs,
          hyperlinks: hyperlinks || r.hyperlinks,
        };
      }
    }
  }
}

export default Image;
