'use strict';

import PageBreaksXform from './page-breaks-xform';

import ListXform from '../list-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';

class RowBreaksXform extends ListXform {
  constructor() {
    const options = {
      tag: 'rowBreaks',
      count: true,
      childXform: new PageBreaksXform(),
    };
    super(options);
  }

  // get tag() { return 'rowBreaks'; }

  override render(xmlStream: XmlStream, model: unknown[] | undefined) {
    if (model && model.length) {
      xmlStream.openNode(this.tag, this.$);
      if (this.count) {
        xmlStream.addAttribute(this.$count, model.length);
        xmlStream.addAttribute('manualBreakCount', model.length);
      }

      const { childXform } = this;
      model.forEach((childModel) => {
        childXform.render(xmlStream, childModel);
      });

      xmlStream.closeNode();
    } else if (this.empty) {
      xmlStream.leafNode(this.tag);
    }
  }
}

export default RowBreaksXform;
