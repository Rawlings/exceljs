import BaseXform from '#src/formats/xlsx/xml/base-xform';

export interface CompyChildOption {
  name?: string;
  tag?: string;
  xform: any;
}

export interface CompyOptions {
  tag: string;
  attrs?: Record<string, any>;
  children: CompyChildOption[];
}

class CompyXform extends BaseXform {
  private _tag: string;
  attrs?: Record<string, any>;
  children: CompyChildOption[];
  override map: Record<string, CompyChildOption>;

  constructor(options: CompyOptions) {
    super();

    this._tag = options.tag;
    this.attrs = options.attrs;
    this.children = options.children;
    this.map = this.children.reduce((map: Record<string, CompyChildOption>, child) => {
      const name = child.name || child.tag || '';
      const tag = child.tag || child.name || '';
      map[tag] = child;
      child.name = name;
      child.tag = tag;
      return map;
    }, {});
  }

  override get tag(): string {
    return this._tag;
  }

  override prepare(model: any, options: any) {
    this.children.forEach((child: any) => {
      if (child.tag) {
        child.xform.prepare(model[child.tag], options);
      }
    });
  }

  override render(xmlStream: any, model: any) {
    xmlStream.openNode(this._tag, this.attrs);
    this.children.forEach((child: any) => {
      if (child.name) {
        child.xform.render(xmlStream, model[child.name]);
      }
    });
    xmlStream.closeNode();
  }

  override parseOpen(node: any) {
    if (this.parser) {
      this.parser.xform.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this._tag:
        this.model = {};
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.xform.parseOpen(node);
          return true;
        }
    }
    return false;
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.xform.parseText(text);
    }
  }

  override parseClose(name: string) {
    if (this.parser) {
      if (!this.parser.xform.parseClose(name)) {
        if (this.parser.name) {
          this.model[this.parser.name] = this.parser.xform.model;
        }
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }

  override reconcile(model: any, options: any) {
    this.children.forEach((child: any) => {
      if (child.tag) {
        child.xform.prepare(model[child.tag], options);
      }
    });
  }
}

export default CompyXform;
