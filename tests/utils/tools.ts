import _ from './under-dash';

const tools = {
  dtMatcher: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.]\d{3}Z$/,
  fix(o): any {
    let clone: any;
    if (o instanceof Array) {
      clone = [];
    } else if (typeof o === 'object' && o !== null) {
      clone = {};
    } else if (typeof o === 'string' && tools.dtMatcher.test(o)) {
      return new Date(o);
    } else {
      return o;
    }
    _.each(o, (value: any, name: any) => {
      if (value !== undefined) {
        clone[name] = tools.fix(value);
      }
    });
    return clone;
  },

  concatenateFormula(...args: any[]) {
    const values = args.map((value: any) => `"${value}"`);
    return {
      formula: `CONCATENATE(${values.join(',')})`,
    };
  },
};

export const fix = tools.fix;
export const concatenateFormula = tools.concatenateFormula;

export default tools;
