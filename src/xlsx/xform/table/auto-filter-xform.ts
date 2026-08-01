import BaseXform from '../base-xform';

import FilterColumnXform from './filter-column-xform';

class AutoFilterXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      filterColumn: new FilterColumnXform(),
    };
  }

  get tag() {
    return 'autoFilter';
  }

  prepare(model: any) {
    model.columns.forEach((column: any, index: any) => {
      this.map.filterColumn.prepare(column, { index });
    });
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, { ref: model.autoFilterRef });

    model.columns.forEach((column: any) => {
      this.map.filterColumn.render(xmlStream, column);
    });

    xmlStream.closeNode();
    return true;
  }

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.tag:
        this.model = {
          autoFilterRef: node.attributes.ref,
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

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
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
