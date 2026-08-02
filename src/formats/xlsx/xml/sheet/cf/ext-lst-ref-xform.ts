/* eslint-disable max-classes-per-file */
import BaseXform from '../../base-xform';
import CompositeXform from '../../composite-xform';
import type XmlStream from '../../../../../utils/stream/xml-stream';

export interface ExtModel {
  x14Id?: string;
}

class X14IdXform extends BaseXform {
  override get tag() {
    return 'x14:id';
  }

  override render(xmlStream: XmlStream, model: string) {
    xmlStream.leafNode(this.tag, undefined, model);
  }

  override parseOpen() {
    this.model = '';
  }

  override parseText(text: string) {
    this.model += text;
  }

  override parseClose(name: string) {
    return name !== this.tag;
  }
}

class ExtXform extends CompositeXform {
  idXform: X14IdXform;

  constructor() {
    super();

    this.map = {
      'x14:id': (this.idXform = new X14IdXform()),
    };
  }

  override get tag() {
    return 'ext';
  }

  override render(xmlStream: XmlStream, model: ExtModel) {
    xmlStream.openNode(this.tag, {
      uri: '{B025F937-C7B1-47D3-B67F-A62EFF666E3E}',
      'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
    });

    this.idXform.render(xmlStream, model.x14Id as string);

    xmlStream.closeNode();
  }

  override createNewModel() {
    return {};
  }

  override onParserClose(_name: string, parser: BaseXform) {
    this.model.x14Id = parser.model;
  }
}

class ExtLstRefXform extends CompositeXform {
  constructor() {
    super();
    this.map = {
      ext: new ExtXform(),
    };
  }

  override get tag() {
    return 'extLst';
  }

  override render(xmlStream: XmlStream, model: ExtModel) {
    xmlStream.openNode(this.tag);
    this.map.ext.render(xmlStream, model);
    xmlStream.closeNode();
  }

  override createNewModel() {
    return {};
  }

  override onParserClose(_name: string, parser: BaseXform) {
    Object.assign(this.model, parser.model);
  }
}

export default ExtLstRefXform;
