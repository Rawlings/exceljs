import BaseXform from '../base-xform';
import ListXform from '../list-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

import CustomFilterXform, { type CustomFilterModel } from './custom-filter-xform';
import FilterXform, { type FilterModel } from './filter-xform';

export interface FilterColumnModel {
  colId?: string;
  filterButton: boolean;
  customFilters?: CustomFilterModel[];
  filters?: FilterModel[];
}

class FilterColumnXform extends BaseXform {
  constructor() {
    super();

    this.map = {
      customFilters: new ListXform({
        tag: 'customFilters',
        count: false,
        empty: true,
        childXform: new CustomFilterXform(),
      }),
      filters: new ListXform({
        tag: 'filters',
        count: false,
        empty: true,
        childXform: new FilterXform(),
      }),
    };
  }

  override get tag() {
    return 'filterColumn';
  }

  override prepare(model: FilterColumnModel, options: { index: number }) {
    model.colId = options.index.toString();
  }

  override render(xmlStream: XmlStream, model: FilterColumnModel) {
    if (model.customFilters) {
      xmlStream.openNode(this.tag, {
        colId: model.colId,
        hiddenButton: model.filterButton ? '0' : '1',
      });

      this.map.customFilters.render(xmlStream, model.customFilters);

      xmlStream.closeNode();
      return true;
    }
    xmlStream.leafNode(this.tag, {
      colId: model.colId,
      hiddenButton: model.filterButton ? '0' : '1',
    });
    return true;
  }

  override parseOpen(node: SaxNode) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    const attributes = node.attributes as Record<string, string>;
    switch (node.name) {
      case this.tag:
        this.model = {
          filterButton: attributes.hiddenButton === '0',
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

  override parseText() {}

  override parseClose(name?: string) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    switch (name) {
      case this.tag:
        // NB: pre-existing behavior only reconciles customFilters here; a
        // parsed `filters` list (this.map.filters.model) is discarded even
        // though the `filters` child xform is wired up in the map above.
        this.model.customFilters = this.map.customFilters.model;
        return false;
      default:
        // could be some unrecognised tags
        return true;
    }
  }
}

export default FilterColumnXform;
