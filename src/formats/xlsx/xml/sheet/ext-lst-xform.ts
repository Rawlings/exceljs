/* eslint-disable max-classes-per-file */
import CompositeXform from '../composite-xform';

import ConditionalFormattingsExt from './cf-ext/conditional-formattings-ext-xform';
import type { ConditionalFormattingsExtModel } from './cf-ext/conditional-formattings-ext-xform';
import type XmlStream from '../../../../utils/stream/xml-stream';

export interface ExtLstModel {
  conditionalFormattings?: ConditionalFormattingsExtModel;
  [key: string]: unknown;
}

class ExtXform extends CompositeXform {
  conditionalFormattings: ConditionalFormattingsExt;

  constructor() {
    super();
    this.map = {
      'x14:conditionalFormattings': (this.conditionalFormattings = new ConditionalFormattingsExt()),
    };
  }

  override get tag() {
    return 'ext';
  }

  hasContent(model: ExtLstModel) {
    return this.conditionalFormattings.hasContent(model?.conditionalFormattings || []);
  }

  override prepare(model: ExtLstModel, options: unknown) {
    this.conditionalFormattings.prepare(model?.conditionalFormattings || [], options);
  }

  override render(xmlStream: XmlStream, model: ExtLstModel) {
    xmlStream.openNode('ext', {
      uri: '{78C0D931-6437-407d-A8EE-F0AAD7539E65}',
      'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
    });

    this.conditionalFormattings.render(xmlStream, model?.conditionalFormattings || []);

    xmlStream.closeNode();
  }

  override createNewModel() {
    return {};
  }

  override onParserClose(name: string, parser: { model: unknown }) {
    this.model[name] = parser.model;
  }
}

class ExtLstXform extends CompositeXform {
  ext: ExtXform;

  constructor() {
    super();

    this.map = {
      ext: (this.ext = new ExtXform()),
    };
  }

  override get tag() {
    return 'extLst';
  }

  override prepare(model: ExtLstModel, options: unknown) {
    this.ext.prepare(model, options);
  }

  hasContent(model: ExtLstModel) {
    return this.ext.hasContent(model);
  }

  override render(xmlStream: XmlStream, model: ExtLstModel) {
    if (!this.hasContent(model)) {
      return;
    }

    xmlStream.openNode('extLst');
    this.ext.render(xmlStream, model);
    xmlStream.closeNode();
  }

  override createNewModel() {
    return {};
  }

  override onParserClose(_name: string, parser: { model: unknown }) {
    Object.assign(this.model, parser.model);
  }
}

export default ExtLstXform;
