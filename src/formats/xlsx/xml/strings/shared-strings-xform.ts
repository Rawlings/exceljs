import XmlStream from '../../../../utils/stream/xml-stream';
import BaseXform from '../base-xform';
import type { SaxNode } from '../base-xform';
import SharedStringXform from './shared-string-xform';
import type { SharedStringModel } from './shared-string-xform';

export interface SharedStringsModel {
  values: SharedStringModel[];
  count: number;
}

class SharedStringsXform extends BaseXform {
  hash: Record<string, number>;
  rich: Record<string, number>;
  _sharedStringXform: SharedStringXform | undefined;
  _values: SharedStringsModel | undefined;

  constructor(model?: SharedStringsModel) {
    super();

    this.model = model || {
      values: [],
      count: 0,
    };
    this.hash = Object.create(null);
    this.rich = Object.create(null);
  }

  get sharedStringXform() {
    return this._sharedStringXform || (this._sharedStringXform = new SharedStringXform());
  }

  get values() {
    return this.model.values;
  }

  get uniqueCount() {
    return this.model.values.length;
  }

  get count() {
    return this.model.count;
  }

  getString(index: number): SharedStringModel {
    return this.model.values[index];
  }

  add(value: SharedStringModel): number {
    return (value as { richText?: unknown }).richText
      ? this.addRichText(value)
      : this.addText(value as string);
  }

  addText(value: string): number {
    const model = this.model;
    let index = this.hash[value];
    if (index === undefined) {
      index = this.hash[value] = model.values.length;
      model.values.push(value);
    }
    model.count++;
    return index;
  }

  addRichText(value: SharedStringModel): number {
    // TODO: add WeakMap here
    const model = this.model;
    const xml = this.sharedStringXform.toXml(value);
    let index = this.rich[xml];
    if (index === undefined) {
      index = this.rich[xml] = model.values.length;
      model.values.push(value);
    }
    model.count++;
    return index;
  }

  // <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  // <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="<%=totalRefs%>" uniqueCount="<%=count%>">
  //   <si><t><%=text%></t></si>
  //   <si><r><rPr></rPr><t></t></r></si>
  // </sst>

  override render(xmlStream: XmlStream, modelInput?: SharedStringsModel) {
    const model = modelInput || (this._values as SharedStringsModel);
    xmlStream.openXml(XmlStream.StdDocAttributes);

    xmlStream.openNode('sst', {
      xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      count: model.count,
      uniqueCount: model.values.length,
    });

    const sx = this.sharedStringXform;
    model.values.forEach((sharedString) => {
      sx.render(xmlStream, sharedString);
    });
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'sst':
        return true;
      case 'si':
        this.parser = this.sharedStringXform;
        this.parser.parseOpen(node);
        return true;
      default:
        throw new Error(`Unexpected xml node in parseOpen: ${JSON.stringify(node)}`);
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
        const model = this.model;
        model.values.push(this.parser.model);
        model.count++;
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case 'sst':
        return false;
      default:
        throw new Error(`Unexpected xml node in parseClose: ${name}`);
    }
  }
}

export default SharedStringsXform;
