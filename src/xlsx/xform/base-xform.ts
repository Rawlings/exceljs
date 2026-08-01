import parseSax from '../../utils/parse-sax';
import XmlStream from '../../utils/xml-stream';

/* 'virtual' methods used as a form of documentation */
/* eslint-disable class-methods-use-this */

// Base class for Xforms
class BaseXform {
  model: any;
  map: any;
  parser: any;
  get tag(): any {
    return undefined;
  }

  // ============================================================
  // Virtual Interface
  prepare(_model?: any, _options?: any): void {
    // optional preparation (mutation) of model so it is ready for write
  }

  render(_xmlStream?: any, _model?: any, _arg3?: any): void {
    // convert model to xml
  }

  parseOpen(_node?: any): boolean | void {
    // XML node opened
  }

  parseText(_text?: any): void {
    // chunk of text encountered for current node
  }

  parseClose(_name?: any): boolean | void {
    // XML node closed
  }

  reconcile(_model?: any, _options?: any): void {
    // optional post-parse step (opposite to prepare)
  }

  // ============================================================
  reset(): void {
    // to make sure parses don't bleed to next iteration
    this.model = null;

    // if we have a map - reset them too
    if (this.map) {
      Object.values(this.map).forEach((xform: any) => {
        if (xform instanceof BaseXform) {
          xform.reset();
        } else if (xform && xform.xform) {
          xform.xform.reset();
        }
      });
    }
  }

  mergeModel(obj: any): void {
    // set obj's props to this.model
    this.model = Object.assign(this.model || {}, obj);
  }

  async parse(saxParser: any): Promise<any> {
    for await (const events of saxParser) {
      for (const { eventType, value } of events) {
        if (eventType === 'opentag') {
          this.parseOpen(value);
        } else if (eventType === 'text') {
          this.parseText(value);
        } else if (eventType === 'closetag') {
          if (!this.parseClose(value.name)) {
            return this.model;
          }
        }
      }
    }
    return this.model;
  }

  async parseStream(stream: any): Promise<any> {
    return this.parse(parseSax(stream));
  }

  get xml(): string {
    // convenience function to get the xml of this.model
    // useful for manager types that are built during the prepare phase
    return this.toXml(this.model);
  }

  toXml(model: any): string {
    const xmlStream = new XmlStream();
    this.render(xmlStream, model);
    return xmlStream.xml;
  }

  // ============================================================
  // Useful Utilities
  static toAttribute(value: any, dflt?: any, always: boolean = false): string | undefined {
    if (value === undefined) {
      if (always) {
        return dflt;
      }
    } else if (always || value !== dflt) {
      return value.toString();
    }
    return undefined;
  }

  static toStringAttribute(value: any, dflt?: any, always: boolean = false): string | undefined {
    return BaseXform.toAttribute(value, dflt, always);
  }

  static toStringValue(attr: any, dflt?: any): any {
    return attr === undefined ? dflt : attr;
  }

  static toBoolAttribute(value: any, dflt?: any, always: boolean = false): string | undefined {
    if (value === undefined) {
      if (always) {
        return dflt;
      }
    } else if (always || value !== dflt) {
      return value ? '1' : '0';
    }
    return undefined;
  }

  static toBoolValue(attr: any, dflt?: any): boolean {
    return attr === undefined ? dflt : attr === '1';
  }

  static toIntAttribute(value: any, dflt?: any, always: boolean = false): string | undefined {
    return BaseXform.toAttribute(value, dflt, always);
  }

  static toIntValue(attr: any, dflt?: any): number {
    return attr === undefined ? dflt : parseInt(attr, 10);
  }

  static toFloatAttribute(value: any, dflt?: any, always: boolean = false): string | undefined {
    return BaseXform.toAttribute(value, dflt, always);
  }

  static toFloatValue(attr: any, dflt?: any): number {
    return attr === undefined ? dflt : parseFloat(attr);
  }
}

export default BaseXform;
