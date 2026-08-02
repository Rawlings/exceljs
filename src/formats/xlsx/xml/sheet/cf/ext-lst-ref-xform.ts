/* eslint-disable max-classes-per-file */
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import CompositeXform from '#src/formats/xlsx/xml/composite-xform';

class X14IdXform extends BaseXform {
  get tag() {
    return 'x14:id';
  }

  render(xmlStream: any, model: any) {
    xmlStream.leafNode(this.tag, null, model);
  }

  parseOpen() {
    this.model = '';
  }

  parseText(text: any) {
    this.model += text;
  }

  parseClose(name: any) {
    return name !== this.tag;
  }
}

class ExtXform extends CompositeXform {
  idXform: any;

  constructor() {
    super();

    this.map = {
      'x14:id': (this.idXform = new X14IdXform()),
    };
  }

  get tag() {
    return 'ext';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag, {
      uri: '{B025F937-C7B1-47D3-B67F-A62EFF666E3E}',
      'xmlns:x14': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/main',
    });

    this.idXform.render(xmlStream, model.x14Id);

    xmlStream.closeNode();
  }

  createNewModel() {
    return {};
  }

  onParserClose(name: any, parser: any) {
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

  get tag() {
    return 'extLst';
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode(this.tag);
    this.map.ext.render(xmlStream, model);
    xmlStream.closeNode();
  }

  createNewModel() {
    return {};
  }

  onParserClose(name: any, parser: any) {
    Object.assign(this.model, parser.model);
  }
}

export default ExtLstRefXform;
