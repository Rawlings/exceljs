import BaseXform from '#src/xlsx/xform/base-xform';

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
  tag: string;
  attrs?: Record<string, any>;
  children: CompyChildOption[];
  map: Record<string, CompyChildOption>;
  parser?: CompyChildOption;

  constructor(options: CompyOptions) {
    super();

    this.tag = options.tag;
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

  prepare(model, options: any) {
    this.children.forEach((child: any) => {
      if (child.tag) {
        child.xform.prepare(model[child.tag], options);
      }
    });
  }

  render(xmlStream, model: any) {
    xmlStream.openNode(this.tag, this.attrs);
    this.children.forEach((child: any) => {
      if (child.name) {
        child.xform.render(xmlStream, model[child.name]);
      }
    });
    xmlStream.closeNode();
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.xform.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
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

  parseText(text: string) {
    if (this.parser) {
      this.parser.xform.parseText(text);
    }
  }

  parseClose(name: string) {
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

  reconcile(model, options: any) {
    this.children.forEach((child: any) => {
      if (child.tag) {
        child.xform.prepare(model[child.tag], options);
      }
    });
  }
}

export default CompyXform;
