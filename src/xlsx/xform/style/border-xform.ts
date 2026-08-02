/* eslint-disable max-classes-per-file */
import BaseXform from '#src/xlsx/xform/base-xform';
import utils from '#src/utils/helpers/utils';

import ColorXform from '#src/xlsx/xform/style/color-xform';

class EdgeXform extends BaseXform {
  static validStyleValues: any;
  name: string;
  defaultColor: any;

  constructor(name?: any) {
    super();

    this.name = name;
    this.map = {
      color: new ColorXform(),
    };
  }

  get tag() {
    return this.name;
  }

  render(xmlStream: any, model: any, defaultColor: any) {
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

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case this.name: {
        const { style } = node.attributes;
        if (style) {
          this.model = {
            style,
          };
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

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
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
        this.model.color = this.map.color.model;
      }
    }

    return false;
  }

  validStyle(value: any) {
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
].reduce((p: any, v: any) => {
  p[v] = true;
  return p;
}, {});

// Border encapsulates translation from border model to/from xlsx
class BorderXform extends BaseXform {
  diagonalUp?: boolean;
  diagonalDown?: boolean;

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

  render(xmlStream: any, model: any) {
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
    function add(edgeModel: any, edgeXform: any) {
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

  parseOpen(node: any) {
    if (this.parser) {
      this.parser.parseOpen(node);
      return true;
    }
    switch (node.name) {
      case 'border':
        this.reset();
        this.diagonalUp = utils.parseBoolean(node.attributes.diagonalUp);
        this.diagonalDown = utils.parseBoolean(node.attributes.diagonalDown);
        return true;
      default:
        this.parser = this.map[node.name];
        if (this.parser) {
          this.parser.parseOpen(node);
          return true;
        }
        return false;
    }
  }

  parseText(text: any) {
    if (this.parser) {
      this.parser.parseText(text);
    }
  }

  parseClose(name: any) {
    if (this.parser) {
      if (!this.parser.parseClose(name)) {
        this.parser = undefined;
      }
      return true;
    }
    if (name === 'border') {
      const model: any = (this.model = {});
      const add = function (key: any, edgeModel?: any, extensions?: any) {
        if (edgeModel) {
          if (extensions) {
            Object.assign(edgeModel, extensions);
          }
          model[key] = edgeModel;
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
