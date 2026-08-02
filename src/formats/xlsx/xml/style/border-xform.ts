/* eslint-disable max-classes-per-file */
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import utils from '#src/utils/helpers/utils';

import ColorXform from '#src/formats/xlsx/xml/style/color-xform';
import type { ColorModel } from '#src/formats/xlsx/xml/style/color-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface EdgeModel {
  style?: string;
  color?: ColorModel;
  up?: boolean;
  down?: boolean;
}

export interface BorderModel {
  top?: EdgeModel;
  left?: EdgeModel;
  bottom?: EdgeModel;
  right?: EdgeModel;
  diagonal?: EdgeModel;
  color?: ColorModel;
}

class EdgeXform extends BaseXform {
  static validStyleValues: Record<string, boolean>;
  name: string;
  defaultColor: ColorModel | undefined;
  override map: { color: ColorXform };

  constructor(name?: string) {
    super();

    this.name = name as string;
    this.map = {
      color: new ColorXform(),
    };
  }

  override get tag() {
    return this.name;
  }

  override render(xmlStream: XmlStream, model: EdgeModel | undefined, defaultColor?: ColorModel) {
    const color = (model && model.color) || defaultColor || this.defaultColor;
    xmlStream.openNode(this.name);
    if (model && model.style) {
      xmlStream.addAttribute('style', model.style);
      if (color) {
        this.map.color.render(xmlStream, color);
      }
    }
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.name: {
        const { style } = node.attributes as Record<string, string>;
        if (style) {
          this.model = {
            style,
          } as EdgeModel;
        } else {
          this.model = undefined;
        }
        return true;
      }
      case 'color':
        this.parser = this.map.color;
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
        this.parser = undefined;
      }
      return true;
    }

    if (name === this.name) {
      if (this.map.color.model) {
        if (!this.model) {
          this.model = {};
        }
        (this.model as EdgeModel).color = this.map.color.model;
      }
    }

    return false;
  }

  validStyle(value: string): boolean {
    return EdgeXform.validStyleValues[value];
  }
}

EdgeXform.validStyleValues = [
  'thin',
  'dashed',
  'dotted',
  'dashDot',
  'hair',
  'dashDotDot',
  'slantDashDot',
  'mediumDashed',
  'mediumDashDotDot',
  'mediumDashDot',
  'medium',
  'double',
  'thick',
].reduce(
  (p: Record<string, boolean>, v) => {
    p[v] = true;
    return p;
  },
  {} as Record<string, boolean>
);

// Border encapsulates translation from border model to/from xlsx
class BorderXform extends BaseXform {
  diagonalUp?: boolean;
  diagonalDown?: boolean;
  override map: {
    top: EdgeXform;
    left: EdgeXform;
    bottom: EdgeXform;
    right: EdgeXform;
    diagonal: EdgeXform;
  };

  constructor() {
    super();

    this.map = {
      top: new EdgeXform('top'),
      left: new EdgeXform('left'),
      bottom: new EdgeXform('bottom'),
      right: new EdgeXform('right'),
      diagonal: new EdgeXform('diagonal'),
    };
  }

  override render(xmlStream: XmlStream, model: BorderModel) {
    const { color } = model;
    xmlStream.openNode('border');
    if (model.diagonal && model.diagonal.style) {
      if (model.diagonal.up) {
        xmlStream.addAttribute('diagonalUp', '1');
      }
      if (model.diagonal.down) {
        xmlStream.addAttribute('diagonalDown', '1');
      }
    }
    function add(edgeModel: EdgeModel | undefined, edgeXform: EdgeXform) {
      if (edgeModel && !edgeModel.color && model.color) {
        // don't mess with incoming models
        edgeModel = {
          ...edgeModel,
          color: model.color,
        };
      }
      edgeXform.render(xmlStream, edgeModel, color);
    }
    add(model.left, this.map.left);
    add(model.right, this.map.right);
    add(model.top, this.map.top);
    add(model.bottom, this.map.bottom);
    add(model.diagonal, this.map.diagonal);

    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'border':
        this.reset();
        this.diagonalUp = utils.parseBoolean(
          (node.attributes as Record<string, string>).diagonalUp
        );
        this.diagonalDown = utils.parseBoolean(
          (node.attributes as Record<string, string>).diagonalDown
        );
        return true;
      default:
        this.parser = this.map[node.name as keyof BorderXform['map']];
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
        this.parser = undefined;
      }
      return true;
    }
    if (name === 'border') {
      const model: BorderModel = (this.model = {});
      const add = function (
        key: keyof BorderModel,
        edgeModel?: EdgeModel,
        extensions?: Partial<EdgeModel>
      ) {
        if (edgeModel) {
          if (extensions) {
            Object.assign(edgeModel, extensions);
          }
          (model[key] as EdgeModel) = edgeModel;
        }
      };
      add('left', this.map.left.model);
      add('right', this.map.right.model);
      add('top', this.map.top.model);
      add('bottom', this.map.bottom.model);
      add('diagonal', this.map.diagonal.model, { up: this.diagonalUp, down: this.diagonalDown });
    }
    return false;
  }
}

export default BorderXform;
