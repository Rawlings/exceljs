const { toString } = Object.prototype;
const escapeHtmlRegex = /["&<>]/;
const _ = {
  each: function each(obj: any, cb: any) {
    if (obj) {
      if (Array.isArray(obj)) {
        obj.forEach(cb);
      } else {
        Object.keys(obj).forEach((key) => {
          cb(obj[key], key);
        });
      }
    }
  },

  some: function some(obj: any, cb: any) {
    if (obj) {
      if (Array.isArray(obj)) {
        return obj.some(cb);
      }
      return Object.keys(obj).some((key) => cb(obj[key], key));
    }
    return false;
  },

  every: function every(obj: any, cb: any) {
    if (obj) {
      if (Array.isArray(obj)) {
        return obj.every(cb);
      }
      return Object.keys(obj).every((key) => cb(obj[key], key));
    }
    return true;
  },

  map: function map(obj: any, cb: any) {
    if (obj) {
      if (Array.isArray(obj)) {
        return obj.map(cb);
      }
      return Object.keys(obj).map((key) => cb(obj[key], key));
    }
    return [];
  },

  keyBy(a: any, p: any) {
    return a.reduce((o: any, v: any) => {
      o[v[p]] = v;
      return o;
    }, {});
  },

  isEqual: function isEqual(a: any, b: any): boolean {
    const aType = typeof a;
    const bType = typeof b;
    const aArray = Array.isArray(a);
    const bArray = Array.isArray(b);
    let keys;

    if (aType !== bType) {
      return false;
    }
    switch (typeof a) {
      case 'object':
        if (aArray || bArray) {
          if (aArray && bArray) {
            return (
              a.length === b.length &&
              a.every((aValue, index) => {
                const bValue = b[index];
                return _.isEqual(aValue, bValue);
              })
            );
          }
          return false;
        }

        if (a === null || b === null) {
          return a === b;
        }

        // Compare object keys and values
        keys = Object.keys(a);

        if (Object.keys(b).length !== keys.length) {
          return false;
        }

        for (const key of keys) {
          if (!b.hasOwnProperty(key)) {
            return false;
          }
        }

        return _.every(a, (aValue: any, key: any) => {
          const bValue = b[key];
          return _.isEqual(aValue, bValue);
        });

      default:
        return a === b;
    }
  },

  escapeHtml(html: any) {
    const regexResult = escapeHtmlRegex.exec(html);
    if (!regexResult) return html;

    let result = '';
    let escape = '';
    let lastIndex = 0;
    let i = regexResult.index;
    for (; i < html.length; i++) {
      switch (html.charAt(i)) {
        case '"':
          escape = '&quot;';
          break;
        case '&':
          escape = '&amp;';
          break;
        case "'":
          escape = '&apos;';
          break;
        case '<':
          escape = '&lt;';
          break;
        case '>':
          escape = '&gt;';
          break;
        default:
          continue;
      }
      if (lastIndex !== i) result += html.substring(lastIndex, i);
      lastIndex = i + 1;
      result += escape;
    }
    if (lastIndex !== i) return result + html.substring(lastIndex, i);
    return result;
  },

  strcmp(a: any, b: any) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  },

  isUndefined(val: any) {
    return toString.call(val) === '[object Undefined]';
  },

  isObject(val: any) {
    return toString.call(val) === '[object Object]';
  },

  deepMerge(...args: any[]) {
    const target = args[0] || {};
    const length = args.length;
    // eslint-disable-next-line one-var
    let src: any, clone: any, copyIsArray: any;

    function assignValue(val: any, key: any) {
      src = target[key];
      copyIsArray = Array.isArray(val);
      if (_.isObject(val) || copyIsArray) {
        if (copyIsArray) {
          copyIsArray = false;
          clone = src && Array.isArray(src) ? src : [];
        } else {
          clone = src && _.isObject(src) ? src : {};
        }
        target[key] = _.deepMerge(clone, val);
      } else if (!_.isUndefined(val)) {
        target[key] = val;
      }
    }

    for (let i = 0; i < length; i++) {
      _.each(args[i], assignValue);
    }
    return target;
  },
};

export default _;
