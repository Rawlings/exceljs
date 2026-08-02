import BaseXform from '../base-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

import FilterColumnXform, { type FilterColumnModel } from './filter-column-xform';

export interface AutoFilterModel {
  autoFilterRef?: string;
  columns: FilterColumnModel[];
}

class AutoFilterXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      filterColumn: new FilterColumnXform(),
    };
  }

  override get tag() {
    return 'autoFilter';
  }

  override prepare(model: AutoFilterModel) {
    model.columns.forEach((column, index) => {
      this.map.filterColumn.prepare(column, { index });
    });
  }

  override render(xmlStream: XmlStream, model: AutoFilterModel) {
    xmlStream.openNode(this.tag as string, { ref: model.autoFilterRef });

    model.columns.forEach((column) => {
      this.map.filterColumn.render(xmlStream, column);
    });

    xmlStream.closeNode();
    return true;
  }

  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.model = {
          autoFilterRef: (node.attributes as Record<string, string>).ref,
          columns: [],
        };
        return true;

      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parseOpen(node);
          return true;
        }
        throw new Error(`Unexpected xml node in parseOpen: ${JSON.stringify(node)}`);
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name?: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model.columns.push(this.parser.model);
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        return false;
      default:
        throw new Error(`Unexpected xml node in parseClose: ${name}`);
    }
  }
}

export default AutoFilterXform;
