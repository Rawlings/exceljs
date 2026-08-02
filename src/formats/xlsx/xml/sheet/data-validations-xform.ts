import _ from '../../../../utils/helpers/under-dash';
import utils from '../../../../utils/helpers/utils';
import colCache from '../../../../utils/data/col-cache';
import BaseXform from '../base-xform';
import Range from '../../../../core/range';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface DataValidationModel {
  type: string;
  formulae?: unknown[];
  operator?: string;
  allowBlank?: boolean;
  showInputMessage?: boolean;
  showErrorMessage?: boolean;
  promptTitle?: string;
  prompt?: string;
  errorStyle?: string;
  errorTitle?: string;
  error?: string;
  sqref?: string;
}

export type DataValidationsModel = Record<string, DataValidationModel>;

function assign(
  definedName: Record<string, unknown>,
  attributes: Record<string, string>,
  name: string,
  defaultValue: unknown
) {
  const value = attributes[name];
  if (value !== undefined) {
    definedName[name] = value;
  } else if (defaultValue !== undefined) {
    definedName[name] = defaultValue;
  }
}

function assignBool(
  definedName: Record<string, unknown>,
  attributes: Record<string, string>,
  name: string,
  defaultValue: unknown
) {
  const value = attributes[name];
  if (value !== undefined) {
    definedName[name] = utils.parseBoolean(value);
  } else if (defaultValue !== undefined) {
    definedName[name] = defaultValue;
  }
}

function optimiseDataValidations(model: DataValidationsModel) {
  // Squeeze alike data validations together into rectangular ranges
  // to reduce file size and speed up Excel load time
  const dvList = _.map(model, (dataValidation: DataValidationModel, address: string) => ({
    address,
    dataValidation,
    marked: false,
  })).sort((a, b) => _.strcmp(a.address, b.address));
  const dvMap = _.keyBy(dvList, 'address');
  const matchCol = (addr: any, height: any, col: any) => {
    for (let i = 0; i < height; i++) {
      const otherAddress = colCache.encodeAddress(addr.row + i, col);
      if (!model[otherAddress] || !_.isEqual(model[addr.address], model[otherAddress])) {
        return false;
      }
    }
    return true;
  };
  return dvList
    .map((dv) => {
      if (!dv.marked) {
        const addr = colCache.decodeEx(dv.address) as any;
        if (addr.dimensions) {
          dvMap[addr.dimensions].marked = true;
          return {
            ...dv.dataValidation,
            sqref: dv.address,
          };
        }

        // iterate downwards - finding matching cells
        let height = 1;
        let otherAddress = colCache.encodeAddress(addr.row + height, addr.col);
        while (model[otherAddress] && _.isEqual(dv.dataValidation, model[otherAddress])) {
          height++;
          otherAddress = colCache.encodeAddress(addr.row + height, addr.col);
        }

        // iterate rightwards...

        let width = 1;
        while (matchCol(addr, height, addr.col + width)) {
          width++;
        }

        // mark all included addresses
        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            otherAddress = colCache.encodeAddress(addr.row + i, addr.col + j);
            dvMap[otherAddress].marked = true;
          }
        }

        if (height > 1 || width > 1) {
          const bottom = addr.row + (height - 1);
          const right = addr.col + (width - 1);
          return {
            ...dv.dataValidation,
            sqref: `${dv.address}:${colCache.encodeAddress(bottom, right)}`,
          };
        }
        return {
          ...dv.dataValidation,
          sqref: dv.address,
        };
      }
      return null;
    })
    .filter(Boolean) as DataValidationModel[];
}

class DataValidationsXform extends BaseXform {
  _address: string | undefined;
  _dataValidation: DataValidationModel | undefined;
  _formula: string[] | undefined;

  override get tag() {
    return 'dataValidations';
  }

  override render(xmlStream: XmlStream, model: DataValidationsModel) {
    const optimizedModel = optimiseDataValidations(model);
    if (optimizedModel.length) {
      xmlStream.openNode('dataValidations', { count: optimizedModel.length });

      optimizedModel.forEach((value) => {
        xmlStream.openNode('dataValidation');

        if (value.type !== 'any') {
          xmlStream.addAttribute('type', value.type);

          if (value.operator && value.type !== 'list' && value.operator !== 'between') {
            xmlStream.addAttribute('operator', value.operator);
          }
          if (value.allowBlank) {
            xmlStream.addAttribute('allowBlank', '1');
          }
        }
        if (value.showInputMessage) {
          xmlStream.addAttribute('showInputMessage', '1');
        }
        if (value.promptTitle) {
          xmlStream.addAttribute('promptTitle', value.promptTitle);
        }
        if (value.prompt) {
          xmlStream.addAttribute('prompt', value.prompt);
        }
        if (value.showErrorMessage) {
          xmlStream.addAttribute('showErrorMessage', '1');
        }
        if (value.errorStyle) {
          xmlStream.addAttribute('errorStyle', value.errorStyle);
        }
        if (value.errorTitle) {
          xmlStream.addAttribute('errorTitle', value.errorTitle);
        }
        if (value.error) {
          xmlStream.addAttribute('error', value.error);
        }
        xmlStream.addAttribute('sqref', value.sqref);
        (value.formulae || []).forEach((formula, index: number) => {
          xmlStream.openNode(`formula${index + 1}`);
          if (value.type === 'date') {
            xmlStream.writeText(utils.dateToExcel(new Date(formula as string | number), false));
          } else {
            xmlStream.writeText(formula);
          }
          xmlStream.closeNode();
        });
        xmlStream.closeNode();
      });
      xmlStream.closeNode();
    }
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case 'dataValidations':
        this.model = {};
        return true;

      case 'dataValidation': {
        const attrs = node.attributes as Record<string, string>;
        this._address = attrs.sqref;
        const dataValidation: DataValidationModel = { type: attrs.type || 'any', formulae: [] };

        if (attrs.type) {
          assignBool(
            dataValidation as unknown as Record<string, unknown>,
            attrs,
            'allowBlank',
            undefined
          );
        }
        assignBool(
          dataValidation as unknown as Record<string, unknown>,
          attrs,
          'showInputMessage',
          undefined
        );
        assignBool(
          dataValidation as unknown as Record<string, unknown>,
          attrs,
          'showErrorMessage',
          undefined
        );

        switch (dataValidation.type) {
          case 'any':
          case 'list':
          case 'custom':
            break;
          default:
            assign(
              dataValidation as unknown as Record<string, unknown>,
              attrs,
              'operator',
              'between'
            );
            break;
        }
        assign(
          dataValidation as unknown as Record<string, unknown>,
          attrs,
          'promptTitle',
          undefined
        );
        assign(dataValidation as unknown as Record<string, unknown>, attrs, 'prompt', undefined);
        assign(
          dataValidation as unknown as Record<string, unknown>,
          attrs,
          'errorStyle',
          undefined
        );
        assign(
          dataValidation as unknown as Record<string, unknown>,
          attrs,
          'errorTitle',
          undefined
        );
        assign(dataValidation as unknown as Record<string, unknown>, attrs, 'error', undefined);

        this._dataValidation = dataValidation;
        return true;
      }

      case 'formula1':
      case 'formula2':
        this._formula = [];
        return true;

      default:
        return false;
    }
  }

  override parseText(text: string) {
    if (this._formula) {
      this._formula.push(text);
    }
  }

  override parseClose(name: string): boolean {
    switch (name) {
      case 'dataValidations':
        return false;
      case 'dataValidation': {
        const dataValidation = this._dataValidation as DataValidationModel;
        if (!dataValidation.formulae || !dataValidation.formulae.length) {
          delete dataValidation.formulae;
          delete dataValidation.operator;
        }
        // The four known cases: 1. E4:L9 N4:U9  2.E4 L9  3. N4:U9  4. E4
        const list = (this._address as string).split(/\s+/g) || [];
        list.forEach((addr) => {
          if (addr.includes(':')) {
            const range = new Range(addr);
            range.forEachAddress((address: string) => {
              (this.model as DataValidationsModel)[address] = dataValidation;
            });
          } else {
            (this.model as DataValidationsModel)[addr] = dataValidation;
          }
        });
        return true;
      }
      case 'formula1':
      case 'formula2': {
        let formula: string | number | Date = (this._formula as string[]).join('');
        const dataValidation = this._dataValidation as DataValidationModel;
        switch (dataValidation.type) {
          case 'whole':
          case 'textLength':
            formula = parseInt(formula, 10);
            break;
          case 'decimal':
            formula = parseFloat(formula);
            break;
          case 'date':
            formula = utils.excelToDate(parseFloat(formula), false);
            break;
          default:
            break;
        }
        (dataValidation.formulae as unknown[]).push(formula);
        this._formula = undefined;
        return true;
      }
      default:
        return true;
    }
  }
}

export default DataValidationsXform;
