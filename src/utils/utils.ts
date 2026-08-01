import fs from 'fs';

// useful stuff
const inherits = function (cls: any, superCtor: any, statics: any, prototype: any) {
  // eslint-disable-next-line no-underscore-dangle
  cls.super_ = superCtor;

  if (!prototype) {
    prototype = statics;
    statics = null;
  }

  if (statics) {
    Object.keys(statics).forEach((i) => {
      Object.defineProperty(cls, i, Object.getOwnPropertyDescriptor(statics, i)!);
    });
  }

  const properties: any = {
    constructor: {
      value: cls,
      enumerable: false,
      writable: false,
      configurable: true,
    },
  };
  if (prototype) {
    Object.keys(prototype).forEach((i) => {
      properties[i] = Object.getOwnPropertyDescriptor(prototype, i);
    });
  }

  cls.prototype = Object.create(superCtor.prototype, properties);
};

// eslint-disable-next-line no-control-regex
const xmlDecodeRegex = /[<>&'"\x7F\x00-\x08\x0B-\x0C\x0E-\x1F]/;
const utils = {
  nop() {},
  promiseImmediate(value: any) {
    return new Promise((resolve) => {
      if (typeof setImmediate !== 'undefined') {
        setImmediate(() => {
          resolve(value);
        });
      } else {
        // poorman's setImmediate - must wait at least 1ms
        setTimeout(() => {
          resolve(value);
        }, 1);
      }
    });
  },
  inherits,
  dateToExcel(d: any, date1904: any) {
    // eslint-disable-next-line no-mixed-operators
    return 25569 + d.getTime() / (24 * 3600 * 1000) - (date1904 ? 1462 : 0);
  },
  excelToDate(v: any, date1904: any) {
    // eslint-disable-next-line no-mixed-operators
    const millisecondSinceEpoch = Math.round(
      (v - 25569 + (date1904 ? 1462 : 0)) * 24 * 3600 * 1000
    );
    return new Date(millisecondSinceEpoch);
  },
  parsePath(filepath: any) {
    const last = filepath.lastIndexOf('/');
    return {
      path: filepath.substring(0, last),
      name: filepath.substring(last + 1),
    };
  },
  getRelsPath(filepath: any) {
    const path = utils.parsePath(filepath);
    return `${path.path}/_rels/${path.name}.rels`;
  },
  xmlEncode(text: any) {
    const regexResult = xmlDecodeRegex.exec(text);
    if (!regexResult) return text;

    let result = '';
    let escape = '';
    let lastIndex = 0;
    let i = regexResult.index;
    for (; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      switch (charCode) {
        case 34: // "
          escape = '&quot;';
          break;
        case 38: // &
          escape = '&amp;';
          break;
        case 39: // '
          escape = '&apos;';
          break;
        case 60: // <
          escape = '&lt;';
          break;
        case 62: // >
          escape = '&gt;';
          break;
        case 127:
          escape = '';
          break;
        default: {
          if (charCode <= 31 && (charCode <= 8 || (charCode >= 11 && charCode !== 13))) {
            escape = '';
            break;
          }
          continue;
        }
      }
      if (lastIndex !== i) result += text.substring(lastIndex, i);
      lastIndex = i + 1;
      if (escape) result += escape;
    }
    if (lastIndex !== i) return result + text.substring(lastIndex, i);
    return result;
  },
  xmlDecode(text: any) {
    return text.replace(/&([a-z]*);/g, (c: any) => {
      switch (c) {
        case '&lt;':
          return '<';
        case '&gt;':
          return '>';
        case '&amp;':
          return '&';
        case '&apos;':
          return "'";
        case '&quot;':
          return '"';
        default:
          return c;
      }
    });
  },
  validInt(value: any) {
    const i = parseInt(value, 10);
    return !Number.isNaN(i) ? i : 0;
  },

  isDateFmt(fmt: any) {
    if (!fmt) {
      return false;
    }

    // must remove all chars inside quotes and []
    fmt = fmt.replace(/\[[^\]]*]/g, '');
    fmt = fmt.replace(/"[^"]*"/g, '');
    // then check for date formatting chars
    const result = fmt.match(/[ymdhMsb]+/) !== null;
    return result;
  },

  fs: {
    exists(path: any) {
      return new Promise((resolve) => {
        fs.access(path, fs.constants.F_OK, (err) => {
          resolve(!err);
        });
      });
    },
  },

  toIsoDateString(dt: any) {
    return dt.toIsoString().subsstr(0, 10);
  },

  parseBoolean(value: any) {
    return value === true || value === 'true' || value === 1 || value === '1';
  },

  *range(start: any, stop: any, step: any = 1) {
    const compareOrder = step > 0 ? (a: any, b: any) => a < b : (a: any, b: any) => a > b;
    for (let value = start; compareOrder(value, stop); value += step) {
      yield value;
    }
  },

  toSortedArray(values: any) {
    const result = Array.from(values);

    // Note: per default, `Array.prototype.sort()` converts values
    // to strings when comparing. Here, if we have numbers, we use
    // numeric sort.
    if (result.every((item) => Number.isFinite(item as number))) {
      const compareNumbers = (a: any, b: any) => (a as number) - (b as number);
      return result.sort(compareNumbers);
    }

    return result.sort();
  },

  objectFromProps(props: any, value: any = null) {
    // *Note*: Using `reduce` as `Object.fromEntries` requires Node 12+;
    // ExcelJs is >=8.3.0 (as of 2023-10-08).
    // return Object.fromEntries(props.map(property => [property, value]));
    return props.reduce((result: any, property: any) => {
      result[property] = value;
      return result;
    }, {});
  },
};

export default utils;
