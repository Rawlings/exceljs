import BaseXform from '../base-xform';
import type { SaxNode } from '../base-xform';

export interface CellAnchorModel {
  // NB: `range` is only guaranteed to be present once a value has come through
  // parseOpen; some callers (see reconcile tests) pass partial models that
  // skip it directly, so it's typed optional here to match actual usage.
  range?: {
    editAs: string;
    tl?: unknown;
    br?: unknown;
    ext?: unknown;
  };
  picture?: unknown;
  medium?: unknown;
  anchorType?: string;
  // NB: reconcile() in the two-cell/one-cell anchor xforms is sometimes
  // called (see specs) with a flat object carrying tl/br directly rather
  // than nested under `range` — pre-existing test/behavior quirk, not
  // something to "fix" here.
  tl?: unknown;
  br?: unknown;
}

class BaseCellAnchorXform extends BaseXform {
  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.reset();
        this.model = {
          range: {
            editAs: (node.attributes as Record<string, string>).editAs || 'oneCell',
          },
        };
        break;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
        }
        break;
    }
    return true;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  reconcilePicture(model: any, options: any) {
    if (model && model.rId) {
      const rel = options.rels[model.rId];
      const match = rel.Target.match(/.*\/media\/(.+[.][a-zA-Z]{3,4})/);
      if (match) {
        const name = match[1];
        const mediaId = options.mediaIndex[name];
        return options.media[mediaId];
      }
    }
    return undefined;
  }
}

export default BaseCellAnchorXform;
