import srcUnderDash from '../../src/utils/helpers/under-dash';

const _ = Object.assign(
  {
    get(obj: any, path: any, dflt?: any) {
      let parts = typeof path === 'string' ? path.split('.') : [...path];
      while (obj && parts.length) {
        obj = obj[parts.shift()];
      }
      return obj !== undefined ? obj : dflt;
    },

    has(obj: any, path: any) {
      const dummy = {};
      return _.get(obj, path, dummy) !== dummy;
    },

    cloneDeep(obj: any, preserveUndefined = true): any {
      if (obj === null) {
        return null;
      }
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      let clone: any;
      if (Array.isArray(obj)) {
        clone = [];
      } else if (typeof obj === 'object') {
        clone = {};
      } else {
        return obj;
      }
      _.each(obj, (value: any, name: any) => {
        if (value !== undefined) {
          clone[name] = _.cloneDeep(value, preserveUndefined);
        } else if (preserveUndefined) {
          clone[name] = undefined;
        }
      });
      return clone;
    },
  },
  srcUnderDash
);

export const get = _.get;
export const has = _.has;
export const cloneDeep = _.cloneDeep;
export const each = _.each;
export const map = _.map;
export const some = _.some;
export const every = _.every;
export const isEqual = _.isEqual;

export default _;
