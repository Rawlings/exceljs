/* eslint-disable max-classes-per-file */
import BaseXform from '#src/formats/xlsx/xml/base-xform';

import ColorXform from '#src/formats/xlsx/xml/style/color-xform';
import type { ColorModel } from '#src/formats/xlsx/xml/style/color-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface StopModel {
  position: number;
  color: ColorModel;
}

export interface PatternFillModel {
  type: 'pattern';
  pattern: string;
  fgColor?: ColorModel;
  bgColor?: ColorModel;
}

export interface GradientCenter {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface GradientFillModel {
  type: 'gradient';
  gradient?: 'angle' | 'path';
  degree?: number;
  center?: GradientCenter;
  stops: StopModel[];
}

export type FillModel = PatternFillModel | GradientFillModel;

class StopXform extends BaseXform {
  override map: { color: ColorXform };

  constructor() {
    super();

    this.map = {
      color: new ColorXform(),
    };
  }

  override get tag() {
    return 'stop';
  }

  override render(xmlStream: XmlStream, model: StopModel) {
    xmlStream.openNode('stop');
    xmlStream.addAttribute('position', model.position);
    this.map.color.render(xmlStream, model.color);
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'stop':
        this.model = {
          position: parseFloat((node.attributes as Record<string, string>).position),
        };
        return true;
      case 'color':
        this.parser = this.map.color;
        this.parser.parseOpen(node);
        return true;
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        (this.model as StopModel).color = this.parser.model;
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }
}

class PatternFillXform extends BaseXform {
  override map: { fgColor: ColorXform; bgColor: ColorXform };

  constructor() {
    super();

    this.map = {
      fgColor: new ColorXform('fgColor'),
      bgColor: new ColorXform('bgColor'),
    };
  }

  get name() {
    return 'pattern';
  }

  override get tag() {
    return 'patternFill';
  }

  override render(xmlStream: XmlStream, model: PatternFillModel) {
    xmlStream.openNode('patternFill');
    xmlStream.addAttribute('patternType', model.pattern);
    if (model.fgColor) {
      this.map.fgColor.render(xmlStream, model.fgColor);
    }
    if (model.bgColor) {
      this.map.bgColor.render(xmlStream, model.bgColor);
    }
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'patternFill':
        this.model = {
          type: 'pattern',
          pattern: (node.attributes as Record<string, string>).patternType,
        };
        return true;
      default:
        this.parser = this.map[node.name as keyof PatternFillXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        if (this.parser.model) {
          (this.model as Record<string, unknown>)[name] = this.parser.model;
        }
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }
}

class GradientFillXform extends BaseXform {
  override map: { stop: StopXform };

  constructor() {
    super();

    this.map = {
      stop: new StopXform(),
    };
  }

  get name() {
    return 'gradient';
  }

  override get tag() {
    return 'gradientFill';
  }

  override render(xmlStream: XmlStream, model: GradientFillModel) {
    xmlStream.openNode('gradientFill');
    switch (model.gradient) {
      case 'angle':
        xmlStream.addAttribute('degree', model.degree);
        break;
      case 'path': {
        xmlStream.addAttribute('type', 'path');
        const center = model.center as GradientCenter;
        if (center.left) {
          xmlStream.addAttribute('left', center.left);
          if (center.right === undefined) {
            xmlStream.addAttribute('right', center.left);
          }
        }
        if (center.right) {
          xmlStream.addAttribute('right', center.right);
        }
        if (center.top) {
          xmlStream.addAttribute('top', center.top);
          if (center.bottom === undefined) {
            xmlStream.addAttribute('bottom', center.top);
          }
        }
        if (center.bottom) {
          xmlStream.addAttribute('bottom', center.bottom);
        }
        break;
      }

      default:
        break;
    }

    const stopXform = this.map.stop;
    model.stops.forEach((stopModel) => {
      stopXform.render(xmlStream, stopModel);
    });

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'gradientFill': {
        const attrs = node.attributes as Record<string, string>;
        const model: GradientFillModel = {
          type: 'gradient',
          stops: [],
        };
        this.model = model;
        if (attrs.degree) {
          model.gradient = 'angle';
          model.degree = parseInt(attrs.degree, 10);
        } else if (attrs.type === 'path') {
          model.gradient = 'path';
          model.center = {
            left: attrs.left ? parseFloat(attrs.left) : 0,
            top: attrs.top ? parseFloat(attrs.top) : 0,
          };
          if (attrs.right !== attrs.left) {
            model.center.right = attrs.right ? parseFloat(attrs.right) : 0;
          }
          if (attrs.bottom !== attrs.top) {
            model.center.bottom = attrs.bottom ? parseFloat(attrs.bottom) : 0;
          }
        }
        return true;
      }

      case 'stop':
        this.parser = this.map.stop;
        this.parser.parseOpen(node);
        return true;

      default:
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        (this.model as GradientFillModel).stops.push(this.parser.model);
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }
}

// Fill encapsulates translation from fill model to/from xlsx
class FillXform extends BaseXform {
  static StopXform: typeof StopXform;
  static PatternFillXform: typeof PatternFillXform;
  static GradientFillXform: typeof GradientFillXform;
  static validPatternValues: Record<string, boolean>;
  override map: { patternFill: PatternFillXform; gradientFill: GradientFillXform };

  constructor() {
    super();

    this.map = {
      patternFill: new PatternFillXform(),
      gradientFill: new GradientFillXform(),
    };
  }

  override get tag() {
    return 'fill';
  }

  override render(xmlStream: XmlStream, model: FillModel) {
    xmlStream.addRollback();
    xmlStream.openNode('fill');
    switch (model.type) {
      case 'pattern':
        this.map.patternFill.render(xmlStream, model);
        break;
      case 'gradient':
        this.map.gradientFill.render(xmlStream, model);
        break;
      default:
        xmlStream.rollback();
        return;
    }
    xmlStream.closeNode();
    xmlStream.commit();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'fill':
        this.model = {};
        return true;
      default:
        this.parser = this.map[node.name as keyof FillXform['map']];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
        return false;
    }
  }

  override parseText(text: string) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  override parseClose(name: string): boolean {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.model = this.parser.model;
        (this.model as Record<string, unknown>).type = (
          this.parser as unknown as { name: string }
        ).name;
        this.parser = undefined;
      }
      return true;
    }
    return false;
  }

  validStyle(value: string): boolean {
    return FillXform.validPatternValues[value];
  }
}

FillXform.validPatternValues = [
  'none',
  'solid',
  'darkVertical',
  'darkGray',
  'mediumGray',
  'lightGray',
  'gray125',
  'gray0625',
  'darkHorizontal',
  'darkVertical',
  'darkDown',
  'darkUp',
  'darkGrid',
  'darkTrellis',
  'lightHorizontal',
  'lightVertical',
  'lightDown',
  'lightUp',
  'lightGrid',
  'lightTrellis',
  'lightGrid',
].reduce(
  (p: Record<string, boolean>, v) => {
    p[v] = true;
    return p;
  },
  {} as Record<string, boolean>
);

FillXform.StopXform = StopXform;
FillXform.PatternFillXform = PatternFillXform;
FillXform.GradientFillXform = GradientFillXform;

export default FillXform;
