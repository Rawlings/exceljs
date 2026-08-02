import srcUnderDash from '#src/utils/under-dash';

const _ = Object.assign(
  {
    get(obj, path, dflt?: any) {
      if (typeof path === 'string') {
        path = path.split('.');
      }
      while (obj && path.length) {
        obj = obj[path.shift()];
      }
      return obj !== undefined ? obj : dflt;
    },

    has(obj, path: any) {
      const dummy = {};
      return _.get(obj, path, dummy) !== dummy;
    },

    cloneDeep(obj, preserveUndefined?: boolean) {
      if (preserveUndefined === undefined) {
        preserveUndefined = true;
      }
      let clone: any;
      if (obj === null) {
        return null;
      }
      if (obj instanceof Date) {
        return obj;
      }
      if (obj instanceof Array) {
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
