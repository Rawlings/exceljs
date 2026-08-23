import colCache from '../utils/data/col-cache';
import { Anchor } from './anchor';
import type { AnchorWorksheet, AnchorModel } from './anchor';

export interface Image {
  extension: 'jpeg' | 'png' | 'gif' | 'JPEG' | 'PNG' | 'GIF';
  base64?: string;
  filename?: string;
  buffer?: Buffer;
}

export type ImagePayload = Image;

export interface Media {
  type: string;
  name: string;
  extension: string;
  buffer: Buffer;
}

export interface ImageRange {
  tl: Anchor;
  br: Anchor;
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
  tl: Anchor | AnchorModel | string | { col?: number; row?: number };
  br?: Anchor | AnchorModel | { col?: number; row?: number };
  ext?: { width: number; height: number };
  editAs?: string;
  hyperlinks?: Partial<ImageHyperlinkValue>;
}

export interface ImageRangeInternal {
  tl: Anchor;
  br?: Anchor;
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

export class WorksheetImage {
  worksheet: AnchorWorksheet | undefined;
  type: ImageType | undefined;
  imageId: number | undefined;
  range: ImageRangeInternal | undefined;

  constructor(worksheet?: AnchorWorksheet, model?: ImageModel | Media | Record<string, unknown>) {
    this.worksheet = worksheet;
    if (model) {
      this.model = model;
    }
  }

  get model(): ImageModel {
    switch (this.type) {
      case 'background':
        return {
          type: this.type,
          imageId: this.imageId ?? 0,
        };
      case 'image':
        return {
          type: this.type,
          imageId: this.imageId ?? 0,
          range: {
            tl: this.range?.tl.model ?? {
              col: 0,
              row: 0,
              nativeCol: 0,
              nativeRow: 0,
              nativeColOff: 0,
              nativeRowOff: 0,
            },
            br: this.range?.br?.model,
            ext: this.range?.ext,
            editAs: this.range?.editAs,
          },
          hyperlinks: this.range?.hyperlinks,
        };
      case undefined:
      default:
        throw new Error('Invalid Image Type');
    }
  }

  set model(value: ImageModel | Media | Record<string, unknown>) {
    const type =
      'type' in value && (value.type === 'background' || value.type === 'image')
        ? value.type
        : undefined;
    const imageId =
      'imageId' in value && typeof value.imageId === 'number' ? value.imageId : undefined;
    const range = 'range' in value ? value.range : undefined;
    const hyperlinks = 'hyperlinks' in value ? value.hyperlinks : undefined;
    this.type = type;
    this.imageId = imageId;

    if (type === 'image') {
      if (typeof range === 'string') {
        const decoded = colCache.decode(range);
        const left = 'top' in decoded ? decoded.left : decoded.col;
        const top = 'top' in decoded ? decoded.top : decoded.row;
        const right = 'top' in decoded ? decoded.right : decoded.col;
        const bottom = 'top' in decoded ? decoded.bottom : decoded.row;
        this.range = {
          tl: new Anchor(this.worksheet, { col: left, row: top }, -1),
          br: new Anchor(this.worksheet, { col: right, row: bottom }, 0),
          editAs: 'oneCell',
        };
      } else if (range && typeof range === 'object' && 'tl' in range) {
        const tlVal = range.tl;
        const tlAnchor =
          tlVal instanceof Anchor
            ? tlVal
            : new Anchor(
                this.worksheet,
                typeof tlVal === 'object' && tlVal !== null ? tlVal : undefined,
                0,
              );
        const brVal = 'br' in range ? range.br : undefined;
        const brAnchor = brVal
          ? brVal instanceof Anchor
            ? brVal
            : new Anchor(this.worksheet, typeof brVal === 'object' ? brVal : undefined, 0)
          : undefined;
        const extObj =
          'ext' in range && typeof range.ext === 'object' && range.ext !== null
            ? range.ext
            : undefined;
        let extVal: { width: number; height: number } | undefined;
        if (
          extObj &&
          'width' in extObj &&
          'height' in extObj &&
          typeof extObj.width === 'number' &&
          typeof extObj.height === 'number'
        ) {
          extVal = { width: extObj.width, height: extObj.height };
        }
        const editAsVal =
          'editAs' in range && typeof range.editAs === 'string' ? range.editAs : undefined;
        const hyperlinksVal =
          'hyperlinks' in range && typeof range.hyperlinks === 'object' && range.hyperlinks !== null
            ? (range.hyperlinks as Partial<ImageHyperlinkValue>)
            : undefined;
        this.range = {
          tl: tlAnchor,
          br: brAnchor,
          ext: extVal,
          editAs: editAsVal,
          hyperlinks: hyperlinks && typeof hyperlinks === 'object' ? hyperlinks : hyperlinksVal,
        };
      }
    }
  }
}

export default WorksheetImage;
