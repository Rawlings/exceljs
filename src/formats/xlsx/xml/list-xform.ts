import BaseXform from './base-xform';
import type { SaxNode } from './base-xform';

interface ListXformOptions {
  tag: string;
  always?: boolean;
  count?: boolean;
  empty?: boolean;
  $count?: string;
  $?: Record<string, unknown>;
  childXform: BaseXform;
  maxItems?: number;
}

class ListXform extends BaseXform {
  _tag!: string;
  always: boolean;
  count: boolean;
  empty: boolean;
  $count: string;
  $: Record<string, unknown> | undefined;
  childXform: BaseXform;
  maxItems: number | undefined;

  override get tag() {
    return this._tag;
  }

  override set tag(val: string) {
    this._tag = val;
  }

  constructor(options?: Partial<ListXformOptions>) {
    super();
    options = options || {};

    this.tag = options.tag as string;
    this.always = !!options.always;
    this.count = !!options.count;
    this.empty = !!options.empty;
    this.$count = options.$count || 'count';
    this.$ = options.$;
    this.childXform = options.childXform as BaseXform;
    this.maxItems = options.maxItems;
  }

  override prepare(model: unknown[] | undefined, options: Record<string, unknown>) {
    const { childXform } = this;
    if (model) {
      model.forEach((childModel, index) => {
        options.index = index;
        childXform.prepare(childModel, options);
      });
    }
  }

  override render(xmlStream: import('../../../utils/stream/xml-stream').default, model: unknown[] | undefined) {
    if (this.always || (model && model.length)) {
      xmlStream.openNode(this.tag, this.$);
      if (this.count) {
        xmlStream.addAttribute(this.$count, (model && model.length) || 0);
      }

      const { childXform } = this;
      (model || []).forEach((childModel, index) => {
        childXform.render(xmlStream, childModel, index);
      });

      xmlStream.closeNode();
    } else if (this.empty) {
      xmlStream.leafNode(this.tag);
    }
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.model = [];
        return true;
      default:
        if (this.childXform.parseOpen(node)) {
          this.parser = this.childXform;
          return true;
        }
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.push(this.parser.model);
        this.parser = undefined;

        if (this.maxItems && this.model.length > this.maxItems) {
          throw new Error(`Max ${this.childXform.tag} count (${this.maxItems}) exceeded`);
        }
      }
      return true;
    }

    return false;
  }

  override reconcile(model: unknown[] | undefined, options: Record<string, unknown>) {
    if (model) {
      const { childXform } = this;
      model.forEach((childModel) => {
        childXform.reconcile(childModel, options);
      });
    }
  }
}

export default ListXform;
