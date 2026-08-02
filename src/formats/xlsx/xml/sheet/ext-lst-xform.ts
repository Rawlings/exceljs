/* eslint-disable max-classes-per-file */
import CompositeXform from '#src/formats/xlsx/xml/composite-xform';

import ConditionalFormattingsExt from '#src/formats/xlsx/xml/sheet/cf-ext/conditional-formattings-ext-xform';

class ExtXform extends CompositeXform {
  conditionalFormattings: any;

  constructor() {
    super();
    this.map = {
      'x14:conditionalFormattings': (this.conditionalFormattings = new ConditionalFormattingsExt()),
    };
  }

  get tag() {
    return 'ext';
  }

  hasContent(model: any) {
    return this.conditionalFormattings.hasContent(model.conditionalFormattings);
  }

  prepare(model: any, options: any) {
    this.conditionalFormattings.prepare(model.conditionalFormattings, options);
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode('ext', {
      uri: '{78C0D931-6437-407d-A8EE-F0AAD7539E65}',
      'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
    });

    this.conditionalFormattings.render(xmlStream, model.conditionalFormattings);

    xmlStream.closeNode();
  }

  createNewModel() {
    return {};
  }

  onParserClose(name: any, parser: any) {
    this.model[name] = parser.model;
  }
}

class ExtLstXform extends CompositeXform {
  ext: any;

  constructor() {
    super();

    this.map = {
      ext: (this.ext = new ExtXform()),
    };
  }

  get tag() {
    return 'extLst';
  }

  prepare(model: any, options: any) {
    this.ext.prepare(model, options);
  }

  hasContent(model: any) {
    return this.ext.hasContent(model);
  }

  render(xmlStream: any, model: any) {
    if (!this.hasContent(model)) {
      return;
    }

    xmlStream.openNode('extLst');
    this.ext.render(xmlStream, model);
    xmlStream.closeNode();
  }

  createNewModel() {
    return {};
  }

  onParserClose(name: any, parser: any) {
    Object.assign(this.model, parser.model);
  }
}

export default ExtLstXform;
