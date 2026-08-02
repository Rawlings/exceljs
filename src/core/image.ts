import colCache from '../utils/data/col-cache';
import Anchor from './anchor';
import type { AnchorWorksheet, AnchorModel } from './anchor';

export interface ImagePayload {
  extension: 'jpeg' | 'png' | 'gif' | string;
  base64?: string;
  filename?: string;
  buffer?: Buffer;
}

export interface Media {
  type: string;
  name: string;
  extension: string;
  buffer: Buffer;
}

export interface ImageRange {
  tl: Anchor | { col: number; row: number };
  br?: Anchor | { col: number; row: number };
  ext?: { width: number; height: number };
  editAs?: string;
  hyperlinks?: Partial<ImageHyperlinkValue>;
}

export interface ImagePosition {
  tl: { col: number; row: number };
  ext: { width: number; height: number };
}

export interface ImageHyperlinkValue {
  hyperlink: string;
  tooltip?: string;
}

export type ImageType = 'background' | 'image';

export interface ImageRangeInput {
  tl: AnchorModel | string | { col?: number; row?: number };
  br?: AnchorModel | { col?: number; row?: number };
  ext?: { width: number; height: number };
  editAs?: string;
  hyperlinks?: Partial<ImageHyperlinkValue>;
}

export interface ImageModel {
  type: ImageType;
  imageId: number;
  range?: string | ImageRangeInput;
  hyperlinks?: unknown;
}

export class Image {
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

  get model(): ImageModel | Record<string, unknown> {
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
          hyperlinks: this.range?.hyperlinks,
          range: {
            tl: (this.range?.tl as Anchor | undefined)?.model,
            br: (this.range?.br as Anchor)?.model,
            ext: this.range?.ext,
            editAs: this.range?.editAs,
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
          br: r.br ? new Anchor(this.worksheet, r.br, 0) : undefined,
          ext: r.ext,
          editAs: r.editAs,
          hyperlinks: hyperlinks || r.hyperlinks,
        };
      }
    }
  }
}

export default Image;
