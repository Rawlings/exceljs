import parseSax from '#src/utils/helpers/parse-sax';
import XmlStream from '#src/utils/stream/xml-stream';

/* 'virtual' methods used as a form of documentation */
/* eslint-disable class-methods-use-this */

export interface SaxNode {
  name: string;
  attributes?: Record<string, string>;
}

// Base class for Xforms
//
// NB: `model`/`_model` are intentionally `any` here — each of the ~115
// subclasses stores a completely different, freely-accessed model shape.
// Tightening this to `unknown` at the base class ripples a compile error
// into every subclass that reads a property off `this.model` (which is all
// of them), since none of them narrow before accessing. Fully typing this
// framework requires typing base + every subclass together, matching the
// same "type the whole circular unit at once" approach used for models/ —
// out of scope for this pass. Only the non-polymorphic static utility
// helpers below are tightened, since they aren't overridden by subclasses.
class BaseXform {
  _model: any;
  map: any;
  parser: any;

  get model() {
    return this._model;
  }

  set model(val: any) {
    this._model = val;
  }
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
  static toAttribute(value: unknown, dflt?: unknown, always: boolean = false): string | undefined {
    if (value === undefined) {
      if (always) {
        return dflt as string | undefined;
      }
    } else if (always || value !== dflt) {
      return (value as { toString(): string }).toString();
    }
    return undefined;
  }

  static toStringAttribute(
    value: unknown,
    dflt?: unknown,
    always: boolean = false
  ): string | undefined {
    return BaseXform.toAttribute(value, dflt, always);
  }

  static toStringValue(attr: unknown, dflt?: unknown): unknown {
    return attr === undefined ? dflt : attr;
  }

  static toBoolAttribute(
    value: unknown,
    dflt?: unknown,
    always: boolean = false
  ): string | undefined {
    if (value === undefined) {
      if (always) {
        return dflt as string | undefined;
      }
    } else if (always || value !== dflt) {
      return value ? '1' : '0';
    }
    return undefined;
  }

  static toBoolValue(attr: unknown, dflt?: boolean): boolean {
    return attr === undefined ? (dflt as boolean) : attr === '1';
  }

  static toIntAttribute(
    value: unknown,
    dflt?: unknown,
    always: boolean = false
  ): string | undefined {
    return BaseXform.toAttribute(value, dflt, always);
  }

  static toIntValue(attr: unknown, dflt?: number): number {
    return attr === undefined ? (dflt as number) : parseInt(attr as string, 10);
  }

  static toFloatAttribute(
    value: unknown,
    dflt?: unknown,
    always: boolean = false
  ): string | undefined {
    return BaseXform.toAttribute(value, dflt, always);
  }

  static toFloatValue(attr: unknown, dflt?: number): number {
    return attr === undefined ? (dflt as number) : parseFloat(attr as string);
  }
}

export default BaseXform;
